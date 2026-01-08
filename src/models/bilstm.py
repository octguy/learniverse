"""
BiLSTM model for Vietnamese comment classification.
Multi-label classification for toxic/offensive and hate speech detection.
"""

import torch
import torch.nn as nn
from typing import Optional, Dict, Any


class BiLSTMClassifier(nn.Module):
    """
    Bidirectional LSTM classifier for multi-label text classification.
    
    Architecture:
        Embedding -> BiLSTM -> Attention -> FC -> Sigmoid
    """
    
    def __init__(
        self,
        vocab_size: int,
        embedding_dim: int = 256,
        hidden_dim: int = 128,
        num_layers: int = 2,
        num_labels: int = 2,  # toxic_offensive, hate_speech
        dropout: float = 0.3,
        bidirectional: bool = True,
        padding_idx: int = 0,
        pretrained_embeddings: Optional[torch.Tensor] = None,
        freeze_embeddings: bool = False,
    ):
        """
        Initialize the BiLSTM classifier.
        
        Args:
            vocab_size: Size of vocabulary
            embedding_dim: Dimension of word embeddings
            hidden_dim: Hidden dimension of LSTM
            num_layers: Number of LSTM layers
            num_labels: Number of output labels (for multi-label)
            dropout: Dropout probability
            bidirectional: Whether to use bidirectional LSTM
            padding_idx: Index of padding token
            pretrained_embeddings: Optional pretrained embedding weights
            freeze_embeddings: Whether to freeze embedding weights
        """
        super(BiLSTMClassifier, self).__init__()
        
        self.vocab_size = vocab_size
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_labels = num_labels
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1
        
        # Embedding layer
        self.embedding = nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=embedding_dim,
            padding_idx=padding_idx
        )
        
        # Load pretrained embeddings if provided
        if pretrained_embeddings is not None:
            self.embedding.weight.data.copy_(pretrained_embeddings)
            if freeze_embeddings:
                self.embedding.weight.requires_grad = False
        
        # LSTM layer
        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )
        
        # Attention layer
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * self.num_directions, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1, bias=False)
        )
        
        # Dropout
        self.dropout = nn.Dropout(dropout)
        
        # Fully connected layers
        fc_input_dim = hidden_dim * self.num_directions
        self.fc = nn.Sequential(
            nn.Linear(fc_input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_labels)
        )
        
        # Initialize weights
        self._init_weights()
    
    def _init_weights(self):
        """Initialize weights for better convergence."""
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_uniform_(param.data)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param.data)
            elif 'bias' in name:
                param.data.fill_(0)
                # Set forget gate bias to 1
                n = param.size(0)
                param.data[n//4:n//2].fill_(1)
        
        for module in self.fc.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
    
    def attention_pooling(
        self, 
        lstm_output: torch.Tensor, 
        mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Apply attention mechanism to LSTM outputs.
        
        Args:
            lstm_output: LSTM output tensor (batch, seq_len, hidden_dim * num_directions)
            mask: Attention mask (batch, seq_len), 1 for valid, 0 for padding
            
        Returns:
            Context vector (batch, hidden_dim * num_directions)
        """
        # Compute attention scores
        attention_scores = self.attention(lstm_output).squeeze(-1)  # (batch, seq_len)
        
        # Apply mask
        if mask is not None:
            attention_scores = attention_scores.masked_fill(mask == 0, float('-inf'))
        
        # Softmax to get attention weights
        attention_weights = torch.softmax(attention_scores, dim=1)  # (batch, seq_len)
        
        # Weighted sum of LSTM outputs
        context = torch.bmm(
            attention_weights.unsqueeze(1),  # (batch, 1, seq_len)
            lstm_output  # (batch, seq_len, hidden_dim * num_directions)
        ).squeeze(1)  # (batch, hidden_dim * num_directions)
        
        return context
    
    def forward(
        self, 
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        lengths: Optional[torch.Tensor] = None,
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        
        Args:
            input_ids: Token IDs (batch, seq_len)
            attention_mask: Mask for padding (batch, seq_len)
            lengths: Actual sequence lengths for packing (batch,)
            
        Returns:
            Dictionary with 'logits' and 'probabilities'
        """
        batch_size = input_ids.size(0)
        
        # Embedding
        embedded = self.embedding(input_ids)  # (batch, seq_len, embedding_dim)
        embedded = self.dropout(embedded)
        
        # Pack sequences if lengths provided
        if lengths is not None:
            # Sort by length for packing
            lengths_sorted, sort_idx = lengths.sort(descending=True)
            embedded_sorted = embedded[sort_idx]
            
            # Pack
            packed = nn.utils.rnn.pack_padded_sequence(
                embedded_sorted, 
                lengths_sorted.cpu(), 
                batch_first=True,
                enforce_sorted=True
            )
            
            # LSTM
            lstm_out_packed, (hidden, cell) = self.lstm(packed)
            
            # Unpack
            lstm_output, _ = nn.utils.rnn.pad_packed_sequence(
                lstm_out_packed, 
                batch_first=True
            )
            
            # Unsort
            _, unsort_idx = sort_idx.sort()
            lstm_output = lstm_output[unsort_idx]
        else:
            # Without packing
            lstm_output, (hidden, cell) = self.lstm(embedded)
        
        # Apply attention pooling
        context = self.attention_pooling(lstm_output, attention_mask)
        
        # Dropout
        context = self.dropout(context)
        
        # Classification
        logits = self.fc(context)  # (batch, num_labels)
        
        # Sigmoid for multi-label
        probabilities = torch.sigmoid(logits)
        
        return {
            'logits': logits,
            'probabilities': probabilities
        }
    
    def predict(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        threshold: float = 0.5
    ) -> Dict[str, torch.Tensor]:
        """
        Make predictions with threshold.
        
        Args:
            input_ids: Token IDs
            attention_mask: Attention mask
            threshold: Classification threshold
            
        Returns:
            Dictionary with 'predictions' (binary) and 'probabilities'
        """
        self.eval()
        with torch.no_grad():
            outputs = self.forward(input_ids, attention_mask)
            predictions = (outputs['probabilities'] > threshold).int()
            
        return {
            'predictions': predictions,
            'probabilities': outputs['probabilities']
        }


class MultiLabelFocalLoss(nn.Module):
    """
    Focal Loss for multi-label classification.
    Helps with class imbalance by down-weighting easy examples.
    """
    
    def __init__(
        self, 
        alpha: float = 0.25, 
        gamma: float = 2.0, 
        reduction: str = 'mean'
    ):
        """
        Args:
            alpha: Weighting factor for positive examples
            gamma: Focusing parameter (higher = more focus on hard examples)
            reduction: 'mean', 'sum', or 'none'
        """
        super(MultiLabelFocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction
    
    def forward(
        self, 
        logits: torch.Tensor, 
        targets: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute focal loss.
        
        Args:
            logits: Raw model outputs (batch, num_labels)
            targets: Binary targets (batch, num_labels)
            
        Returns:
            Loss value
        """
        probs = torch.sigmoid(logits)
        
        # Compute focal weights
        pt = torch.where(targets == 1, probs, 1 - probs)
        focal_weight = (1 - pt) ** self.gamma
        
        # Compute BCE loss
        bce_loss = nn.functional.binary_cross_entropy_with_logits(
            logits, targets.float(), reduction='none'
        )
        
        # Apply focal weights and alpha
        alpha_weight = torch.where(targets == 1, self.alpha, 1 - self.alpha)
        focal_loss = alpha_weight * focal_weight * bce_loss
        
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss


def get_model_config(model_size: str = 'base') -> Dict[str, Any]:
    """
    Get predefined model configurations.
    
    Args:
        model_size: 'small', 'base', or 'large'
        
    Returns:
        Configuration dictionary
    """
    configs = {
        'small': {
            'embedding_dim': 128,
            'hidden_dim': 64,
            'num_layers': 1,
            'dropout': 0.5,
        },
        'base': {
            'embedding_dim': 256,
            'hidden_dim': 128,
            'num_layers': 2,
            'dropout': 0.5,
        },
        'large': {
            'embedding_dim': 512,
            'hidden_dim': 256,
            'num_layers': 3,
            'dropout': 0.5,
        },
    }
    return configs.get(model_size, configs['base'])


if __name__ == "__main__":
    # Test the model
    print("Testing BiLSTM Classifier...")
    
    # Create model
    model = BiLSTMClassifier(
        vocab_size=10000,
        embedding_dim=256,
        hidden_dim=128,
        num_layers=2,
        num_labels=2,  # toxic_offensive, hate_speech
    )
    
    # Print model summary
    print("\nModel architecture:")
    print(model)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTotal parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Test forward pass
    batch_size = 4
    seq_len = 50
    input_ids = torch.randint(0, 10000, (batch_size, seq_len))
    attention_mask = torch.ones(batch_size, seq_len)
    
    outputs = model(input_ids, attention_mask)
    print(f"\nInput shape: {input_ids.shape}")
    print(f"Output logits shape: {outputs['logits'].shape}")
    print(f"Output probabilities shape: {outputs['probabilities'].shape}")
    print(f"Sample probabilities: {outputs['probabilities'][0]}")

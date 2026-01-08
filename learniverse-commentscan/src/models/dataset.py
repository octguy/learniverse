"""
Vocabulary builder and text tokenization utilities.
"""

import json
import pickle
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import torch
from torch.utils.data import Dataset


class Vocabulary:
    """
    Vocabulary class for mapping tokens to indices and vice versa.
    """
    
    # Special tokens
    PAD_TOKEN = "<PAD>"
    UNK_TOKEN = "<UNK>"
    BOS_TOKEN = "<BOS>"
    EOS_TOKEN = "<EOS>"
    
    def __init__(
        self,
        max_size: Optional[int] = None,
        min_freq: int = 1,
        special_tokens: Optional[List[str]] = None,
    ):
        """
        Initialize vocabulary.
        
        Args:
            max_size: Maximum vocabulary size (None for unlimited)
            min_freq: Minimum frequency for a token to be included
            special_tokens: Additional special tokens
        """
        self.max_size = max_size
        self.min_freq = min_freq
        
        # Initialize with special tokens
        self.special_tokens = [self.PAD_TOKEN, self.UNK_TOKEN]
        if special_tokens:
            self.special_tokens.extend(special_tokens)
        
        # Token to index mapping
        self.token2idx: Dict[str, int] = {}
        self.idx2token: Dict[int, str] = {}
        
        # Initialize special tokens
        for idx, token in enumerate(self.special_tokens):
            self.token2idx[token] = idx
            self.idx2token[idx] = token
        
        self.is_built = False
    
    @property
    def pad_idx(self) -> int:
        return self.token2idx[self.PAD_TOKEN]
    
    @property
    def unk_idx(self) -> int:
        return self.token2idx[self.UNK_TOKEN]
    
    def __len__(self) -> int:
        return len(self.token2idx)
    
    def __contains__(self, token: str) -> bool:
        return token in self.token2idx
    
    def build(self, texts: List[str]) -> "Vocabulary":
        """
        Build vocabulary from a list of texts.
        
        Args:
            texts: List of tokenized texts (space-separated tokens)
            
        Returns:
            self for chaining
        """
        # Count token frequencies
        counter = Counter()
        for text in texts:
            tokens = text.split()
            counter.update(tokens)
        
        # Filter by minimum frequency
        filtered_tokens = [
            token for token, freq in counter.most_common()
            if freq >= self.min_freq
        ]
        
        # Limit size
        if self.max_size:
            max_tokens = self.max_size - len(self.special_tokens)
            filtered_tokens = filtered_tokens[:max_tokens]
        
        # Add tokens to vocabulary
        for token in filtered_tokens:
            if token not in self.token2idx:
                idx = len(self.token2idx)
                self.token2idx[token] = idx
                self.idx2token[idx] = token
        
        self.is_built = True
        return self
    
    def encode(self, text: str) -> List[int]:
        """
        Convert text to list of token indices.
        
        Args:
            text: Space-separated tokenized text
            
        Returns:
            List of token indices
        """
        tokens = text.split()
        return [self.token2idx.get(token, self.unk_idx) for token in tokens]
    
    def decode(self, indices: List[int]) -> str:
        """
        Convert list of indices back to text.
        
        Args:
            indices: List of token indices
            
        Returns:
            Space-separated tokens
        """
        tokens = [self.idx2token.get(idx, self.UNK_TOKEN) for idx in indices]
        # Remove padding
        tokens = [t for t in tokens if t != self.PAD_TOKEN]
        return ' '.join(tokens)
    
    def save(self, path: Union[str, Path]) -> None:
        """Save vocabulary to file."""
        path = Path(path)
        data = {
            'token2idx': self.token2idx,
            'idx2token': {int(k): v for k, v in self.idx2token.items()},
            'max_size': self.max_size,
            'min_freq': self.min_freq,
            'special_tokens': self.special_tokens,
        }
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @classmethod
    def load(cls, path: Union[str, Path]) -> "Vocabulary":
        """Load vocabulary from file."""
        path = Path(path)
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        vocab = cls(
            max_size=data['max_size'],
            min_freq=data['min_freq'],
        )
        vocab.token2idx = data['token2idx']
        vocab.idx2token = {int(k): v for k, v in data['idx2token'].items()}
        vocab.special_tokens = data['special_tokens']
        vocab.is_built = True
        
        return vocab


class CommentDataset(Dataset):
    """
    PyTorch Dataset for Vietnamese comment classification.
    """
    
    LABEL_NAMES = ['toxic_offensive', 'hate_speech']
    
    def __init__(
        self,
        texts: List[str],
        labels: Optional[List[List[int]]] = None,
        vocab: Optional[Vocabulary] = None,
        max_length: int = 128,
        build_vocab: bool = False,
        vocab_size: Optional[int] = 30000,
        min_freq: int = 2,
    ):
        """
        Initialize dataset.
        
        Args:
            texts: List of preprocessed texts
            labels: List of multi-label targets [[toxic, hate], ...]
            vocab: Pre-built vocabulary (if None and build_vocab=True, will build)
            max_length: Maximum sequence length
            build_vocab: Whether to build vocabulary from texts
            vocab_size: Maximum vocabulary size
            min_freq: Minimum token frequency for vocabulary
        """
        self.texts = texts
        self.labels = labels
        self.max_length = max_length
        
        # Build or use provided vocabulary
        if vocab is not None:
            self.vocab = vocab
        elif build_vocab:
            self.vocab = Vocabulary(max_size=vocab_size, min_freq=min_freq)
            self.vocab.build(texts)
        else:
            raise ValueError("Either provide vocab or set build_vocab=True")
    
    def __len__(self) -> int:
        return len(self.texts)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        text = self.texts[idx]
        
        # Encode text
        token_ids = self.vocab.encode(text)
        
        # Truncate if needed
        if len(token_ids) > self.max_length:
            token_ids = token_ids[:self.max_length]
        
        # Create attention mask (1 for real tokens, 0 for padding)
        attention_mask = [1] * len(token_ids)
        
        # Pad sequences
        padding_length = self.max_length - len(token_ids)
        if padding_length > 0:
            token_ids = token_ids + [self.vocab.pad_idx] * padding_length
            attention_mask = attention_mask + [0] * padding_length
        
        # Create output dict
        item = {
            'input_ids': torch.tensor(token_ids, dtype=torch.long),
            'attention_mask': torch.tensor(attention_mask, dtype=torch.long),
            'length': torch.tensor(min(len(text.split()), self.max_length), dtype=torch.long),
        }
        
        # Add labels if available
        if self.labels is not None:
            item['labels'] = torch.tensor(self.labels[idx], dtype=torch.float)
        
        return item
    
    @classmethod
    def from_dataframe(
        cls,
        df,
        text_column: str,
        label_columns: List[str],
        vocab: Optional[Vocabulary] = None,
        **kwargs
    ) -> "CommentDataset":
        """
        Create dataset from pandas DataFrame.
        
        Args:
            df: pandas DataFrame
            text_column: Name of text column
            label_columns: Names of label columns
            vocab: Pre-built vocabulary
            **kwargs: Additional arguments for __init__
            
        Returns:
            CommentDataset instance
        """
        texts = df[text_column].tolist()
        labels = df[label_columns].values.tolist()
        
        return cls(texts=texts, labels=labels, vocab=vocab, **kwargs)


def collate_fn(batch: List[Dict[str, torch.Tensor]]) -> Dict[str, torch.Tensor]:
    """
    Custom collate function for DataLoader.
    """
    return {
        'input_ids': torch.stack([item['input_ids'] for item in batch]),
        'attention_mask': torch.stack([item['attention_mask'] for item in batch]),
        'lengths': torch.stack([item['length'] for item in batch]),
        'labels': torch.stack([item['labels'] for item in batch]) if 'labels' in batch[0] else None,
    }


if __name__ == "__main__":
    # Test vocabulary and dataset
    print("Testing Vocabulary...")
    
    texts = [
        "đây là một bình_luận bình_thường",
        "thằng này ngu quá độc_hại vãi",
        "sản_phẩm tốt lắm mình rất thích",
    ]
    
    vocab = Vocabulary(max_size=1000, min_freq=1)
    vocab.build(texts)
    
    print(f"Vocabulary size: {len(vocab)}")
    print(f"Sample encoding: {vocab.encode(texts[0])}")
    print(f"Sample decoding: {vocab.decode(vocab.encode(texts[0]))}")
    
    # Test dataset
    print("\nTesting CommentDataset...")
    
    labels = [[0, 0], [1, 0], [0, 0]]  # [toxic_offensive, hate_speech]
    
    dataset = CommentDataset(
        texts=texts,
        labels=labels,
        vocab=vocab,
        max_length=20,
    )
    
    sample = dataset[1]
    print(f"Sample item keys: {sample.keys()}")
    print(f"Input IDs shape: {sample['input_ids'].shape}")
    print(f"Labels: {sample['labels']}")

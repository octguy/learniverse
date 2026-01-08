"""
Vietnamese text preprocessing utilities for comment moderation.
"""

import re
import unicodedata
from typing import List, Optional

# Try to import Vietnamese NLP libraries
try:
    from underthesea import word_tokenize
    HAS_UNDERTHESEA = True
except ImportError:
    HAS_UNDERTHESEA = False
    print("Warning: underthesea not installed. Word segmentation will be disabled.")


class VietnameseTextPreprocessor:
    """
    Preprocessor for Vietnamese social media comments.
    Handles normalization, cleaning, and tokenization.
    """
    
    # Common Vietnamese teen code / slang mappings
    TEENCODE_MAP = {
        "ko": "không",
        "k": "không",
        "kg": "không",
        "khg": "không",
        "kh": "không",
        "dc": "được",
        "đc": "được",
        "dc": "được",
        "vs": "với",
        "j": "gì",
        "gj": "gì",
        "z": "vậy",
        "v": "vậy",
        "vl": "vãi lồn",
        "vcl": "vãi cả lồn",
        "đm": "địt mẹ",
        "dm": "địt mẹ",
        "clgt": "cái lồn gì thế",
        "cc": "cặc",
        "ck": "chồng",
        "vk": "vợ",
        "ny": "người yêu",
        "bn": "bạn",
        "mk": "mình",
        "mik": "mình",
        "ns": "nói",
        "bt": "biết",
        "bít": "biết",
        "trc": "trước",
        "trl": "trả lời",
        "rep": "trả lời",
        "fb": "facebook",
        "ib": "inbox",
        "pm": "tin nhắn",
        "acc": "tài khoản",
        "tk": "tài khoản",
        "sp": "sản phẩm",
        "đt": "điện thoại",
        "sđt": "số điện thoại",
        "ae": "anh em",
        "e": "em",
        "a": "anh",
        "chj": "chị",
        "thik": "thích",
        "lm": "làm",
        "cx": "cũng",
        "cg": "cũng",
        "ng": "người",
        "nguoi": "người",
        "nt": "nhắn tin",
        "ntn": "như thế nào",
        "sao": "sao",
        "r": "rồi",
        "m": "mày",
        "t": "tao",
        "bh": "bây giờ",
        "h": "giờ",
        "nch": "nói chuyện",
        "hđ": "hoạt động",
        "cmt": "bình luận",
        "like": "thích",
        "share": "chia sẻ",
    }
    
    # Regex patterns
    URL_PATTERN = re.compile(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    )
    EMAIL_PATTERN = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
    PHONE_PATTERN = re.compile(r'(\+84|84|0)[0-9]{9,10}')
    REPEATED_CHARS_PATTERN = re.compile(r'(.)\1{2,}')
    EMOJI_PATTERN = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    
    def __init__(
        self,
        lowercase: bool = True,
        remove_urls: bool = True,
        remove_emails: bool = True,
        remove_phones: bool = True,
        remove_emojis: bool = False,
        normalize_teencode: bool = True,
        normalize_repeated_chars: bool = True,
        word_segmentation: bool = True,
        max_length: Optional[int] = None,
    ):
        """
        Initialize the preprocessor.
        
        Args:
            lowercase: Convert text to lowercase
            remove_urls: Remove URLs from text
            remove_emails: Remove email addresses
            remove_phones: Remove phone numbers
            remove_emojis: Remove emojis (keep by default as they can indicate sentiment)
            normalize_teencode: Convert teencode/slang to standard Vietnamese
            normalize_repeated_chars: Reduce repeated characters (e.g., "đẹpppp" -> "đẹp")
            word_segmentation: Apply Vietnamese word segmentation
            max_length: Maximum token length (None for no limit)
        """
        self.lowercase = lowercase
        self.remove_urls = remove_urls
        self.remove_emails = remove_emails
        self.remove_phones = remove_phones
        self.remove_emojis = remove_emojis
        self.normalize_teencode = normalize_teencode
        self.normalize_repeated_chars = normalize_repeated_chars
        self.word_segmentation = word_segmentation and HAS_UNDERTHESEA
        self.max_length = max_length
    
    def normalize_unicode(self, text: str) -> str:
        """Normalize Unicode characters to NFC form."""
        return unicodedata.normalize('NFC', text)
    
    def remove_url(self, text: str) -> str:
        """Remove URLs from text."""
        return self.URL_PATTERN.sub(' ', text)
    
    def remove_email(self, text: str) -> str:
        """Remove email addresses from text."""
        return self.EMAIL_PATTERN.sub(' ', text)
    
    def remove_phone(self, text: str) -> str:
        """Remove phone numbers from text."""
        return self.PHONE_PATTERN.sub(' ', text)
    
    def remove_emoji(self, text: str) -> str:
        """Remove emojis from text."""
        return self.EMOJI_PATTERN.sub(' ', text)
    
    def normalize_repeated(self, text: str) -> str:
        """Reduce repeated characters (e.g., 'đẹpppp' -> 'đẹpp')."""
        return self.REPEATED_CHARS_PATTERN.sub(r'\1\1', text)
    
    def convert_teencode(self, text: str) -> str:
        """Convert teencode/slang to standard Vietnamese."""
        words = text.split()
        result = []
        for word in words:
            lower_word = word.lower()
            if lower_word in self.TEENCODE_MAP:
                result.append(self.TEENCODE_MAP[lower_word])
            else:
                result.append(word)
        return ' '.join(result)
    
    def segment_words(self, text: str) -> str:
        """Apply Vietnamese word segmentation using underthesea."""
        if not HAS_UNDERTHESEA:
            return text
        try:
            return word_tokenize(text, format="text")
        except Exception:
            return text
    
    def clean_whitespace(self, text: str) -> str:
        """Clean up whitespace."""
        # Replace multiple whitespace with single space
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def preprocess(self, text: str) -> str:
        """
        Apply full preprocessing pipeline to text.
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            Preprocessed text
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Normalize Unicode
        text = self.normalize_unicode(text)
        
        # Remove URLs, emails, phones
        if self.remove_urls:
            text = self.remove_url(text)
        if self.remove_emails:
            text = self.remove_email(text)
        if self.remove_phones:
            text = self.remove_phone(text)
        
        # Remove emojis (optional)
        if self.remove_emojis:
            text = self.remove_emoji(text)
        
        # Normalize repeated characters
        if self.normalize_repeated_chars:
            text = self.normalize_repeated(text)
        
        # Lowercase
        if self.lowercase:
            text = text.lower()
        
        # Convert teencode
        if self.normalize_teencode:
            text = self.convert_teencode(text)
        
        # Clean whitespace
        text = self.clean_whitespace(text)
        
        # Word segmentation (should be last for Vietnamese)
        if self.word_segmentation:
            text = self.segment_words(text)
        
        # Truncate if needed
        if self.max_length:
            tokens = text.split()
            if len(tokens) > self.max_length:
                text = ' '.join(tokens[:self.max_length])
        
        return text
    
    def preprocess_batch(self, texts: List[str]) -> List[str]:
        """
        Preprocess a batch of texts.
        
        Args:
            texts: List of input texts
            
        Returns:
            List of preprocessed texts
        """
        return [self.preprocess(text) for text in texts]


# Convenience function
def preprocess_vietnamese(
    text: str,
    word_segmentation: bool = True,
    normalize_teencode: bool = True,
) -> str:
    """
    Quick preprocessing function for Vietnamese text.
    
    Args:
        text: Input text
        word_segmentation: Whether to apply word segmentation
        normalize_teencode: Whether to normalize teencode/slang
        
    Returns:
        Preprocessed text
    """
    preprocessor = VietnameseTextPreprocessor(
        word_segmentation=word_segmentation,
        normalize_teencode=normalize_teencode,
    )
    return preprocessor.preprocess(text)


if __name__ == "__main__":
    # Test the preprocessor
    test_texts = [
        "Đm thằng này ngu vl 😡😡😡",
        "Sản phẩm đẹpppp quá, like nhiều nha https://example.com",
        "Ko bt j mà cmt linh tinh, liên hệ 0123456789",
        "Mấy thằng ng Bắc toàn lừa đảo",
    ]
    
    preprocessor = VietnameseTextPreprocessor()
    
    print("=" * 50)
    print("Vietnamese Text Preprocessing Test")
    print("=" * 50)
    
    for text in test_texts:
        processed = preprocessor.preprocess(text)
        print(f"\nOriginal:  {text}")
        print(f"Processed: {processed}")

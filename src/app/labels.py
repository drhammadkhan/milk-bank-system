"""
ZPL (Zebra Programming Language) label generation for Zebra ZD410 printer
"""
import barcode
from io import BytesIO
from base64 import b64encode


def generate_batch_label_zpl(batch_code: str, bottle_number: int = None, total_bottles: int = None) -> str:
    """
    Generate ZPL format for a single batch label (2.5cm x 5cm).
    
    Args:
        batch_code: The batch code to print
        bottle_number: Optional bottle number (e.g., 1 of 10)
        total_bottles: Optional total bottles in batch
    
    Returns:
        ZPL format string ready to send to Zebra printer
    """
    
    # 2.5cm x 5cm label
    # At 203 DPI: 5cm = ~400 dots, 2.5cm = ~200 dots
    
    # Build ZPL format for 5cm x 2.5cm label (landscape)
    zpl = '^XA\n'  # Start of label
    zpl += '^DF\n'  # Default format
    zpl += '^PW400\n'  # Label width (5cm = 400 dots at 203 DPI)
    zpl += '^PH200\n'  # Label height (2.5cm = 200 dots)
    
    # Print batch code as text
    zpl += '^FO10,10\n'  # Field origin (top-left with small margin)
    zpl += '^A0N,20,20\n'  # Font A, normal, 20x20 (smaller for compact label)
    zpl += f'^FD{batch_code}^FS\n'  # Field data - batch code text
    
    # Print barcode below text - Code128
    zpl += '^FO10,40\n'  # Position for barcode
    zpl += f'^BY2,2.0,50\n'  # Barcode proportions (narrower bars for compact label)
    zpl += f'^BCN,50,Y,N,N\n'  # Code128, height=50, check digit, etc.
    zpl += f'^FD{batch_code}^FS\n'  # Barcode data
    
    zpl += '^XZ\n'  # End of label
    
    return zpl


def generate_batch_labels_zpl(batch_code: str, number_of_bottles: int = 1, batch_date: str = None) -> str:
    """
    Generate ZPL format for multiple labels in a batch (2.5cm x 5cm each).
    One label per bottle.
    
    Args:
        batch_code: The batch code to print
        number_of_bottles: Number of labels to generate
        batch_date: The batch creation date (format: YYYY-MM-DD)
    
    Returns:
        ZPL format string with multiple label definitions
    """
    
    zpl_full = ''
    
    for i in range(1, number_of_bottles + 1):
        # Start each label
        zpl = '^XA\n'
        zpl += '^PW400\n'  # Label width (5cm = 400 dots)
        zpl += '^PH200\n'  # Label height (2.5cm = 200 dots)
        
        # Batch code text
        zpl += '^FO10,10\n'
        zpl += '^A0N,20,20\n'
        zpl += f'^FD{batch_code}^FS\n'
        
        # Batch date and bottle number
        if batch_date:
            zpl += '^FO10,35\n'
            zpl += '^A0N,15,15\n'
            zpl += f'^FD{batch_date} - Bottle {i}/{number_of_bottles}^FS\n'
        
        # Barcode with bottle number
        bottle_code = f'{batch_code}-{i}'
        zpl += '^FO10,55\n'
        zpl += '^BY2,2.0,50\n'
        zpl += '^BCN,50,Y,N,N\n'
        zpl += f'^FD{bottle_code}^FS\n'
        
        zpl += '^XZ\n'
        
        zpl_full += zpl
    
    return zpl_full

"""
Zebra printer communication module for sending ZPL commands to network/USB printers.
Supports Zebra ZD410 and compatible models.
"""

import socket
import subprocess
import platform
import os
from typing import Optional, List, Dict
from pydantic import BaseModel


class PrinterConfig(BaseModel):
    """Printer configuration"""
    name: str
    connection_type: str  # 'network' or 'usb'
    address: str  # IP address for network, device path/name for USB
    port: int = 9100  # Default ZPL port for Zebra printers (network only)
    timeout: int = 10  # Connection timeout in seconds


class PrinterInfo(BaseModel):
    """Information about available printers"""
    name: str
    connection_type: str  # 'network' or 'usb'
    address: str
    port: int = 9100
    status: str  # 'available', 'offline', 'unknown'


class ZebraPrinterManager:
    """Manages communication with Zebra printers"""
    
    # Store current printer config (would be in database in production)
    _current_printer: Optional[PrinterConfig] = None
    
    @classmethod
    def set_printer(cls, config: PrinterConfig) -> None:
        """Set the active printer configuration"""
        cls._current_printer = config
    
    @classmethod
    def get_printer(cls) -> Optional[PrinterConfig]:
        """Get the current printer configuration"""
        return cls._current_printer
    
    @classmethod
    def send_zpl(cls, zpl_content: str, printer_config: Optional[PrinterConfig] = None) -> Dict[str, any]:
        """
        Send ZPL content to a printer via network socket or USB.
        
        Args:
            zpl_content: The ZPL format string to print
            printer_config: Printer configuration. Uses current printer if not provided.
        
        Returns:
            Dict with 'success' and 'message' keys
        """
        config = printer_config or cls._current_printer
        
        if not config:
            return {
                'success': False,
                'message': 'No printer configured. Please set up a printer first.'
            }
        
        if config.connection_type == 'network':
            return cls._send_zpl_network(zpl_content, config)
        elif config.connection_type == 'usb':
            return cls._send_zpl_usb(zpl_content, config)
        else:
            return {
                'success': False,
                'message': f'Unknown connection type: {config.connection_type}'
            }
    
    @classmethod
    def _send_zpl_network(cls, zpl_content: str, config: PrinterConfig) -> Dict[str, any]:
        """Send ZPL via network socket"""
        try:
            # Create socket connection to printer
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(config.timeout)
            
            # Connect to printer
            sock.connect((config.address, config.port))
            
            # Send ZPL commands
            sock.sendall(zpl_content.encode('utf-8'))
            
            # Close connection
            sock.close()
            
            return {
                'success': True,
                'message': f'Successfully sent to network printer {config.name}'
            }
        
        except socket.timeout:
            return {
                'success': False,
                'message': f'Connection timeout. Printer {config.name} at {config.address}:{config.port} not responding.'
            }
        except ConnectionRefusedError:
            return {
                'success': False,
                'message': f'Connection refused. Printer {config.name} at {config.address}:{config.port} is offline or not accepting connections.'
            }
        except socket.error as e:
            return {
                'success': False,
                'message': f'Network error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error sending to network printer: {str(e)}'
            }
    
    @classmethod
    def _send_zpl_usb(cls, zpl_content: str, config: PrinterConfig) -> Dict[str, any]:
        """Send ZPL via USB connection"""
        system = platform.system()
        
        try:
            # Try direct USB device communication first
            if cls._send_zpl_usb_direct(zpl_content, config):
                return {
                    'success': True,
                    'message': f'Successfully sent to USB printer {config.name}'
                }
            
            # If in Docker, provide helpful message about USB limitations
            if os.path.exists('/.dockerenv'):
                return {
                    'success': False,
                    'message': 'USB printing from Docker requires the printer to be in Network mode. Please configure your Zebra printer for network printing, find its IP address (check printer settings or your router), and use Network connection type instead.'
                }
            
            # Fall back to system printer if direct USB fails
            return cls._send_zpl_system_printer(zpl_content, config)
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error sending to USB printer: {str(e)}'
            }
    
    @classmethod
    def _send_zpl_usb_direct(cls, zpl_content: str, config: PrinterConfig) -> bool:
        """Try to send ZPL directly to USB device"""
        system = platform.system()
        
        try:
            if system == 'Darwin':  # macOS specific handling
                # On macOS, try to use the CUPS device URI directly via Python
                # Get the device URI from lpstat
                try:
                    result = subprocess.run(
                        ['lpstat', '-v', config.address],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    
                    # Parse the device URI
                    if 'usb://' in result.stdout:
                        # For USB printers on macOS, we need to use a raw queue
                        # Let's use the socket method to CUPS port
                        import socket
                        
                        # Create a connection to CUPS (port 631) and send as IPP raw
                        # Actually, better approach: use lpr with proper MIME type
                        process = subprocess.Popen(
                            ['lpr', '-P', config.address, '-o', 'document-format=application/vnd.cups-raw'],
                            stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE
                        )
                        stdout, stderr = process.communicate(input=zpl_content.encode('utf-8'), timeout=10)
                        
                        if process.returncode == 0:
                            return True
                        else:
                            print(f'lpr failed: {stderr.decode()}')
                            
                except Exception as e:
                    print(f'macOS USB print attempt failed: {e}')
                    
            if system == 'Linux':
                # Try common USB device paths
                usb_paths = [
                    f'/dev/usb/lp0',
                    f'/dev/usb/lp1', 
                    f'/dev/lp0',
                    f'/dev/lp1',
                    config.address  # Use configured address if it's a device path
                ]
                
                for usb_path in usb_paths:
                    if os.path.exists(usb_path):
                        try:
                            with open(usb_path, 'wb') as f:
                                f.write(zpl_content.encode('utf-8'))
                                f.flush()
                            return True
                        except PermissionError:
                            # Try with sudo if available
                            try:
                                import tempfile
                                with tempfile.NamedTemporaryFile(mode='w', suffix='.zpl', delete=False) as temp_file:
                                    temp_file.write(zpl_content)
                                    temp_path = temp_file.name
                                
                                subprocess.run(['sudo', 'cp', temp_path, usb_path], check=True, timeout=10)
                                os.unlink(temp_path)
                                return True
                            except:
                                continue
                        except:
                            continue
            
            elif system == 'Darwin':  # macOS
                # macOS USB device paths
                usb_paths = [
                    '/dev/cu.usbmodem*',
                    '/dev/cu.usbserial*',
                    config.address
                ]
                
                import glob
                for pattern in usb_paths:
                    if '*' in pattern:
                        for usb_path in glob.glob(pattern):
                            try:
                                with open(usb_path, 'wb') as f:
                                    f.write(zpl_content.encode('utf-8'))
                                    f.flush()
                                return True
                            except:
                                continue
                    elif os.path.exists(pattern):
                        try:
                            with open(pattern, 'wb') as f:
                                f.write(zpl_content.encode('utf-8'))
                                f.flush()
                            return True
                        except:
                            continue
            
            elif system == 'Windows':
                # Windows COM ports and LPT ports
                com_ports = [f'COM{i}' for i in range(1, 10)]
                lpt_ports = [f'LPT{i}' for i in range(1, 4)]
                
                for port in com_ports + lpt_ports + [config.address]:
                    try:
                        import serial
                        with serial.Serial(port, 9600, timeout=config.timeout) as ser:
                            ser.write(zpl_content.encode('utf-8'))
                            ser.flush()
                        return True
                    except ImportError:
                        # pyserial not available, try file approach
                        try:
                            with open(port, 'wb') as f:
                                f.write(zpl_content.encode('utf-8'))
                                f.flush()
                            return True
                        except:
                            continue
                    except:
                        continue
        
        except Exception as e:
            print(f'Direct USB communication failed: {e}')
        
        return False
    
    @classmethod
    def _send_zpl_system_printer(cls, zpl_content: str, config: PrinterConfig) -> Dict[str, any]:
        """Send ZPL using system print commands"""
        system = platform.system()
        
        try:
            if system in ['Darwin', 'Linux']:  # macOS and Linux
                # For macOS/Linux, try to send raw ZPL via stdin to lpr
                try:
                    process = subprocess.Popen(
                        ['lpr', '-P', config.address, '-o', 'raw'],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    stdout, stderr = process.communicate(input=zpl_content.encode('utf-8'), timeout=10)
                    
                    if process.returncode != 0:
                        return {
                            'success': False,
                            'message': f'Print command failed: {stderr.decode()}'
                        }
                    
                    return {
                        'success': True,
                        'message': f'Successfully sent to USB printer {config.name}'
                    }
                except Exception as e:
                    return {
                        'success': False,
                        'message': f'Error sending to printer: {str(e)}'
                    }
            
            elif system == 'Windows':
                # Windows approach with temp file
                import tempfile
                with tempfile.NamedTemporaryFile(mode='wb', suffix='.zpl', delete=False) as f:
                    f.write(zpl_content.encode('utf-8'))
                    temp_file = f.name
                
                try:
                    subprocess.run(['print', '/d:' + config.address, temp_file], check=True, timeout=10)
                    return {
                        'success': True,
                        'message': f'Successfully sent to USB printer {config.name}'
                    }
                finally:
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
        
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'message': f'System printer error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error printing via system: {str(e)}'
            }
    
    @classmethod
    def discover_printers(cls) -> List[PrinterInfo]:
        """
        Discover Zebra printers on the network and via USB.
        
        Returns:
            List of discovered printer information
        """
        discovered = []
        
        # Discover network printers
        discovered.extend(cls._discover_network_printers())
        
        # Discover USB printers
        discovered.extend(cls._discover_usb_printers())
        
        return discovered
    
    @classmethod
    def _discover_network_printers(cls) -> List[PrinterInfo]:
        """Discover network printers"""
        discovered = []
        
        # Check specific addresses (can be configured)
        addresses_to_check = [
            ('localhost', 9100),
            ('127.0.0.1', 9100),
        ]
        
        # Add environment variable based configuration if provided
        if os.getenv('ZEBRA_PRINTER_IP'):
            addresses_to_check.append((os.getenv('ZEBRA_PRINTER_IP'), 9100))
        
        for address, port in addresses_to_check:
            if cls._test_printer_connection(address, port):
                discovered.append(PrinterInfo(
                    name=f'Zebra Printer ({address})',
                    connection_type='network',
                    address=address,
                    port=port,
                    status='available'
                ))
        
        return discovered
    
    @classmethod
    def _discover_usb_printers(cls) -> List[PrinterInfo]:
        """Discover USB-connected printers"""
        discovered = []
        system = platform.system()
        
        try:
            # Get system printers (many USB printers appear here)
            system_printers = cls.get_system_printers()
            for printer_name in system_printers:
                # Include all printers, prioritize Zebra
                if 'zebra' in printer_name.lower() or 'zd410' in printer_name.lower() or 'zd' in printer_name.lower():
                    discovered.append(PrinterInfo(
                        name=printer_name,
                        connection_type='usb',
                        address=printer_name,
                        port=0,
                        status='available'
                    ))
                else:
                    # Include other printers too
                    discovered.append(PrinterInfo(
                        name=printer_name,
                        connection_type='usb',
                        address=printer_name,
                        port=0,
                        status='available'
                    ))
            
            # Check for direct USB devices only if no system printers found
            if not discovered:
                if system == 'Linux':
                    usb_devices = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/lp0', '/dev/lp1']
                    for device in usb_devices:
                        if os.path.exists(device):
                            discovered.append(PrinterInfo(
                                name=f'USB Device ({device})',
                                connection_type='usb',
                                address=device,
                                port=0,
                                status='available'
                            ))
                
                elif system == 'Darwin':  # macOS
                    import glob
                    usb_patterns = ['/dev/cu.usbmodem*', '/dev/cu.usbserial*']
                    for pattern in usb_patterns:
                        for device in glob.glob(pattern):
                            discovered.append(PrinterInfo(
                                name=f'USB Device ({os.path.basename(device)})',
                                connection_type='usb',
                                address=device,
                                port=0,
                                status='available'
                            ))
        
        except Exception as e:
            print(f'Error discovering USB printers: {e}')
        
        return discovered
    
    @classmethod
    def _test_printer_connection(cls, address: str, port: int, timeout: float = 2.0) -> bool:
        """Test if a printer is reachable at the given address:port"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((address, port))
            sock.close()
            return result == 0
        except Exception:
            return False
    
    @classmethod
    def get_system_printers(cls) -> List[str]:
        """
        Get list of system printers (Windows, macOS, Linux).
        This allows using OS-level printer drivers.
        
        Returns:
            List of printer names available in the system
        """
        system = platform.system()
        printers = []
        
        try:
            if system == 'Windows':
                # Use wmic to list printers
                result = subprocess.run(
                    ['wmic', 'logicalprinter', 'get', 'name'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                printers = [line.strip() for line in result.stdout.split('\n')[1:] if line.strip()]
            
            elif system == 'Darwin':  # macOS
                # Use lpstat to list printers
                result = subprocess.run(
                    ['lpstat', '-p'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                # Parse lines like "printer Zebra_Technologies_ZTC_ZD410_203dpi_ZPL is idle..."
                for line in result.stdout.split('\n'):
                    if line.startswith('printer '):
                        parts = line.split()
                        if len(parts) >= 2:
                            printers.append(parts[1])
            
            elif system == 'Linux':
                # Use lpstat to list printers
                result = subprocess.run(
                    ['lpstat', '-p'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                # Parse lines like "printer Zebra_Printer is idle..."
                for line in result.stdout.split('\n'):
                    if line.startswith('printer '):
                        parts = line.split()
                        if len(parts) >= 2:
                            printers.append(parts[1])
        
        except Exception as e:
            print(f'Error discovering system printers: {e}')
        
        return printers
    
    @classmethod
    def print_via_system(cls, zpl_content: str, printer_name: str) -> Dict[str, any]:
        """
        Print ZPL to a system printer using OS drivers.
        Note: This requires a ZPL driver to be installed on the system.
        
        Args:
            zpl_content: The ZPL content to print
            printer_name: Name of the system printer
        
        Returns:
            Dict with 'success' and 'message' keys
        """
        system = platform.system()
        
        try:
            # Write ZPL to temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.zpl', delete=False) as f:
                f.write(zpl_content)
                temp_file = f.name
            
            try:
                if system == 'Windows':
                    # Use print command on Windows
                    subprocess.run(
                        ['print', '/d:' + printer_name, temp_file],
                        check=True,
                        timeout=10
                    )
                
                elif system == 'Darwin':  # macOS
                    # Use lp command
                    subprocess.run(
                        ['lp', '-d', printer_name, temp_file],
                        check=True,
                        timeout=10
                    )
                
                elif system == 'Linux':
                    # Use lp command
                    subprocess.run(
                        ['lp', '-d', printer_name, temp_file],
                        check=True,
                        timeout=10
                    )
                
                return {
                    'success': True,
                    'message': f'Successfully sent to system printer {printer_name}'
                }
            
            finally:
                # Clean up temp file
                os.unlink(temp_file)
        
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'message': f'Printer error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error printing: {str(e)}'
            }


# Global printer manager instance
printer_manager = ZebraPrinterManager()

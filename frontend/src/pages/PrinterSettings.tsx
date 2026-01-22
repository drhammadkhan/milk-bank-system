import { useState, useEffect } from 'react';
import { printers } from '../api';
import { Printer, Wifi, Check, AlertCircle, Settings, Zap } from 'lucide-react';

interface PrinterInfo {
  name: string;
  connection_type: string;
  address: string;
  port: number;
  status: string;
}

interface PrinterConfig {
  name: string;
  connection_type: string;
  address: string;
  port: number;
  timeout: number;
}

export const PrinterSettings: React.FC = () => {
  const [networkPrinters, setNetworkPrinters] = useState<PrinterInfo[]>([]);
  const [usbPrinters, setUsbPrinters] = useState<PrinterInfo[]>([]);
  const [systemPrinters, setSystemPrinters] = useState<string[]>([]);
  const [currentPrinter, setCurrentPrinter] = useState<PrinterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  
  // Manual printer configuration
  const [manualConfig, setManualConfig] = useState({
    name: '',
    connection_type: 'network',
    address: '',
    port: 9100,
    timeout: 10
  });

  useEffect(() => {
    loadCurrentPrinter();
    discoverPrinters();
  }, []);

  const loadCurrentPrinter = async () => {
    try {
      const res = await printers.getCurrent();
      setCurrentPrinter(res.data.printer);
    } catch (err) {
      console.error('Error loading current printer:', err);
    }
  };

  const discoverPrinters = async () => {
    try {
      setDiscovering(true);
      const res = await printers.discover();
      console.log('Discovery response:', res.data);
      const allPrinters = res.data.network_printers || [];
      console.log('All printers:', allPrinters);
      const networkPrintersList = allPrinters.filter((p: PrinterInfo) => p.connection_type === 'network');
      const usbPrintersList = allPrinters.filter((p: PrinterInfo) => p.connection_type === 'usb');
      console.log('Network printers:', networkPrintersList);
      console.log('USB printers:', usbPrintersList);
      setNetworkPrinters(networkPrintersList);
      setUsbPrinters(usbPrintersList);
      setSystemPrinters(res.data.system_printers || []);
    } catch (err) {
      console.error('Error discovering printers:', err);
    } finally {
      setDiscovering(false);
      setLoading(false);
    }
  };

  const configurePrinter = async (config: Omit<PrinterConfig, 'timeout'> & { timeout?: number }) => {
    try {
      setConfiguring(true);
      await printers.configure({
        ...config,
        timeout: config.timeout || 10
      });
      setCurrentPrinter({ ...config, timeout: config.timeout || 10 });
      alert(`Printer "${config.name}" configured successfully!`);
    } catch (err: any) {
      alert('Error configuring printer: ' + (err.response?.data?.detail || err.message));
    } finally {
      setConfiguring(false);
    }
  };

  const testPrinter = async () => {
    if (!currentPrinter) {
      alert('Please configure a printer first');
      return;
    }
    
    try {
      setTesting(true);
      await printers.test();
      alert('Test label sent successfully! Check your printer.');
    } catch (err: any) {
      alert('Test failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTesting(false);
    }
  };

  const handleManualConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualConfig.name || !manualConfig.address) {
      alert('Please enter printer name and address');
      return;
    }
    await configurePrinter(manualConfig);
    setManualConfig({ name: '', connection_type: 'network', address: '', port: 9100, timeout: 10 });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading printer settings...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-gray-700" size={24} />
        <h1 className="text-3xl font-bold text-gray-900">Printer Settings</h1>
      </div>

      {/* Current Printer */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Printer</h2>
          <button
            onClick={testPrinter}
            disabled={!currentPrinter || testing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Zap size={18} />
            {testing ? 'Testing...' : 'Test Print'}
          </button>
        </div>
        
        {currentPrinter ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="text-green-600" size={20} />
            <div>
              <div className="font-medium text-green-900">{currentPrinter.name}</div>
              <div className="text-sm text-green-700">
                {currentPrinter.connection_type === 'network' 
                  ? `${currentPrinter.address}:${currentPrinter.port}` 
                  : `USB: ${currentPrinter.address}`} (timeout: {currentPrinter.timeout}s)
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="text-yellow-600" size={20} />
            <div className="text-yellow-900">No printer configured</div>
          </div>
        )}
      </div>

      {/* Discovered Network Printers */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Network Printers</h2>
          <button
            onClick={discoverPrinters}
            disabled={discovering}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            <Wifi size={16} />
            {discovering ? 'Discovering...' : 'Scan'}
          </button>
        </div>
        
        {networkPrinters.length > 0 ? (
          <div className="space-y-3">
            {networkPrinters.map((printer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Wifi className="text-blue-600" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">{printer.name}</div>
                    <div className="text-sm text-gray-600">
                      {printer.address}:{printer.port} - {printer.status}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => configurePrinter({
                    name: printer.name,
                    connection_type: printer.connection_type,
                    address: printer.address,
                    port: printer.port
                  })}
                  disabled={configuring}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {configuring ? 'Configuring...' : 'Use This'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            No network printers found. Make sure your Zebra printer is connected to the same network.
          </div>
        )}
      </div>

      {/* Discovered USB Printers */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">USB Printers</h2>
        </div>
        
        {usbPrinters.length > 0 ? (
          <div className="space-y-3">
            {usbPrinters.map((printer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Printer className="text-purple-600" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">{printer.name}</div>
                    <div className="text-sm text-gray-600">
                      USB: {printer.address} - {printer.status}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => configurePrinter({
                    name: printer.name,
                    connection_type: printer.connection_type,
                    address: printer.address,
                    port: printer.port
                  })}
                  disabled={configuring}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {configuring ? 'Configuring...' : 'Use This'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            No USB printers found. Make sure your Zebra ZD410 is connected via USB and powered on.
          </div>
        )}
      </div>

      {/* Manual Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Configuration</h2>
        <form onSubmit={handleManualConfig} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Printer Name
            </label>
            <input
              type="text"
              id="name"
              value={manualConfig.name}
              onChange={(e) => setManualConfig({ ...manualConfig, name: e.target.value })}
              placeholder="e.g., Zebra ZD410"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700 mb-1">
              Connection Type
            </label>
            <select
              id="connection_type"
              value={manualConfig.connection_type}
              onChange={(e) => setManualConfig({ 
                ...manualConfig, 
                connection_type: e.target.value,
                port: e.target.value === 'usb' ? 0 : 9100
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="network">Network (Ethernet/WiFi)</option>
              <option value="usb">USB</option>
            </select>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              {manualConfig.connection_type === 'network' ? 'IP Address' : 'USB Port/Device'}
            </label>
            <input
              type="text"
              id="address"
              value={manualConfig.address}
              onChange={(e) => setManualConfig({ ...manualConfig, address: e.target.value })}
              placeholder={manualConfig.connection_type === 'network' ? 'e.g., 192.168.1.100' : 'e.g., COM3, /dev/lp0, or Printer Name'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {manualConfig.connection_type === 'network' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  value={manualConfig.port}
                  onChange={(e) => setManualConfig({ ...manualConfig, port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  id="timeout"
                  value={manualConfig.timeout}
                  onChange={(e) => setManualConfig({ ...manualConfig, timeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={configuring}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {configuring ? 'Configuring...' : 'Configure Printer'}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              <strong>Network Setup:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Connect your Zebra ZD410 to the network via Ethernet or WiFi</li>
                <li>• Print a network configuration label to find the IP address</li>
                <li>• Enter the IP address above and test the connection</li>
                <li>• Default port 9100 works for most Zebra printers</li>
              </ul>
            </div>
            <div>
              <strong>USB Setup (macOS):</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Connect your Zebra ZD410 via USB cable</li>
                <li>• Install Zebra drivers from zebra.com if needed</li>
                <li>• Find printer name: Run <code className="bg-gray-200 px-1">lpstat -p</code> in Terminal</li>
                <li>• Use printer name as address (e.g., "Zebra_Technologies_ZTC_ZD410_203dpi_ZPL")</li>
                <li><strong>Note:</strong> Direct printing has limitations. Use download + Terminal command for best results</li>
              </ul>
            </div>
            <div>
              <strong>macOS USB Printing Workflow:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>1. Configure USB printer above</li>
                <li>2. From batch page, click "Download ZPL" (not direct print)</li>
                <li>3. In Terminal: <code className="bg-gray-200 px-1">cat downloaded_file.zpl | lp -d "PRINTER_NAME"</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
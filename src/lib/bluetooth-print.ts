/**
 * Bluetooth Thermal Printer Helper (ESC/POS)
 * Supports 58mm (approx 32 chars wide)
 */

export async function printToBluetooth(data: {
  shopName: string;
  address: string;
  items: { nama: string; harga: string; jumlah: string }[];
  total: number;
  tanggal: string;
  hari: string;
}) {
  try {
    // Check if Web Bluetooth is supported and available (HTTPS required)
    if (!(navigator as any).bluetooth) {
      throw new Error("Browser Anda tidak mendukung Bluetooth atau Anda sedang menggunakan koneksi tidak aman (HTTP). Silakan gunakan HTTPS atau localhost.");
    }

    // 1. Request Bluetooth Device (Show all devices for user to pick)
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7e11101-4966-4a54-8f88-324147737336',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb'
      ]
    });

    const server = await device.gatt.connect();
    
    // Try to find any writable characteristic in the available services
    const services = await server.getPrimaryServices();
    let characteristic = null;

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          characteristic = char;
          break;
        }
      }
      if (characteristic) break;
    }

    if (!characteristic) {
      throw new Error("Printer tidak mendukung pengiriman data (Write characteristic not found).");
    }

    const encoder = new TextEncoder();
    
    // ESC/POS Commands
    const ESC = 0x1b;
    const GS = 0x1d;
    const INIT = [ESC, 0x40];
    const CENTER = [ESC, 0x61, 0x01];
    const LEFT = [ESC, 0x61, 0x00];
    const BOLD_ON = [ESC, 0x45, 0x01];
    const BOLD_OFF = [ESC, 0x45, 0x00];
    const DOUBLE_SIZE = [GS, 0x21, 0x11]; // Double height and width
    const NORMAL_SIZE = [GS, 0x21, 0x00];

    let commands: number[] = [...INIT];

    // Header
    commands.push(...CENTER, ...BOLD_ON, ...DOUBLE_SIZE);
    commands.push(...Array.from(encoder.encode(data.shopName + '\n')));
    commands.push(...NORMAL_SIZE);
    commands.push(...Array.from(encoder.encode(data.address + '\n')));
    commands.push(...BOLD_OFF);
    commands.push(...Array.from(encoder.encode('--------------------------------\n')));

    // Info
    commands.push(...LEFT);
    commands.push(...Array.from(encoder.encode(`Hari   : ${data.hari}\n`)));
    commands.push(...Array.from(encoder.encode(`Tgl    : ${data.tanggal}\n`)));
    commands.push(...Array.from(encoder.encode('--------------------------------\n')));

    // Items
    data.items.forEach((item, i) => {
      commands.push(...Array.from(encoder.encode(`${i + 1}. ${item.nama}\n`)));
      const line = `   ${item.jumlah} x ${item.harga}`.padEnd(32);
      commands.push(...Array.from(encoder.encode(line + '\n')));
    });

    commands.push(...Array.from(encoder.encode('--------------------------------\n')));

    // Total
    commands.push(...BOLD_ON);
    const totalStr = `TOTAL: Rp ${data.total.toLocaleString('id-ID')}`;
    commands.push(...CENTER, ...Array.from(encoder.encode(totalStr + '\n')));
    commands.push(...BOLD_OFF);

    // Footer
    commands.push(...CENTER, ...Array.from(encoder.encode('\nTERIMA KASIH\n')));
    commands.push(...Array.from(encoder.encode('Atas Kepercayaan Anda\n\n\n\n')));

    // Send in chunks (some printers have small buffers)
    const chunkSize = 20;
    const uint8Commands = new Uint8Array(commands);
    for (let i = 0; i < uint8Commands.length; i += chunkSize) {
      await characteristic.writeValue(uint8Commands.slice(i, i + chunkSize));
    }

    await server.disconnect();
    return true;
  } catch (error) {
    console.error('Bluetooth Print Error:', error);
    throw error;
  }
}

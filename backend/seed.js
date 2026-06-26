const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  console.log('Seeding database with INR prices...');
  try {
    // 1. Clean existing records in correct order
    await db.query('DELETE FROM booking_equipment');
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM quotes');
    await db.query('DELETE FROM events');
    await db.query('DELETE FROM equipment');
    await db.query('DELETE FROM users');

    // Reset auto-increment
    await db.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE equipment AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE events AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE quotes AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE bookings AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE booking_equipment AUTO_INCREMENT = 1');

    // 2. Hash passwords
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('Yashvardhan@15', 10);
    const customerHash = await bcrypt.hash('customer123', 10);

    // 3. Seed Users
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@onepoint.com', adminHash, 'admin']
    );
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['onepoint_admin', 'onepointsolutions619@gmail.com', adminHash, 'admin']
    );
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['manager', 'manager@onepoint.com', managerHash, 'inventory_manager']
    );
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['yashvardhan', 'yashvardhanj1511@gmail.com', managerHash, 'inventory_manager']
    );
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['customer', 'customer@onepoint.com', customerHash, 'customer']
    );

    console.log('Users seeded.');

    // 4. Seed Equipment with realistic Indian Rupee (INR) daily rates
    const equipment = [
      {
        name: "L'Acoustics K2 Line Array Speaker",
        category: 'Audio',
        description: 'Premium active line source array speaker for long-throw audio distribution.',
        daily_rate: 12000.00,
        total_quantity: 16,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=300&auto=format&fit=crop',
        specifications: { power: 'Active 2000W', weight: '56kg', dimensions: '1340 x 354 x 400 mm', output: '147dB SPL Max' }
      },
      {
        name: "L'Acoustics SB28 Subwoofer",
        category: 'Audio',
        description: 'High-power dual 18-inch subwoofer enclosure for low frequency extension.',
        daily_rate: 6500.00,
        total_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop',
        specifications: { power: 'Passive 3000W', weight: '93kg', dimensions: '1300 x 550 x 700 mm', driverSize: 'Dual 18"' }
      },
      {
        name: 'Shure QLXD24/SM58 Wireless Microphone',
        category: 'Audio',
        description: 'Digital wireless receiver paired with the legendary SM58 vocal microphone.',
        daily_rate: 2500.00,
        total_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=300&auto=format&fit=crop',
        specifications: { frequency: 'Digital 24-bit', batteryLife: '9 hours', range: '100m Line of Sight' }
      },
      {
        name: 'Shure MX418 Gooseneck Podium Mic',
        category: 'Audio',
        description: 'Desktop gooseneck microphone designed for speeches, presentations, and lecterns.',
        daily_rate: 1500.00,
        total_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1484755560693-a4074577af3a?q=80&w=300&auto=format&fit=crop',
        specifications: { length: '18 inches', type: 'Cardioid Condenser', power: 'Phantom 48V' }
      },
      {
        name: 'Yamaha CL5 Digital Mixing Console',
        category: 'Audio',
        description: '72-channel digital mixing console with Rio3224-D Dante stage box for professional audio setups.',
        daily_rate: 22000.00,
        total_quantity: 4,
        image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop',
        specifications: { channels: 72, ports: 'Dante primary/secondary', screen: '10.4 inch touch panel' }
      },
      {
        name: 'QSC K12.2 Active Loudspeaker',
        category: 'Audio',
        description: '2000W active portable multi-purpose utility speaker for main PA or stage monitoring.',
        daily_rate: 4000.00,
        total_quantity: 10,
        image_url: 'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=300&auto=format&fit=crop',
        specifications: { power: '2000W Class-D', dsp: 'Intrinsically Corrective', inputs: '2 x XLR/TRS, 1 x 3.5mm' }
      },
      {
        name: 'Barco UDX-4K32 Laser Projector',
        category: 'Video',
        description: 'Ultra-bright 32,000 Lumens 3-Chip DLP 4K laser projector for massive venue screens.',
        daily_rate: 45000.00,
        total_quantity: 2,
        image_url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=300&auto=format&fit=crop',
        specifications: { brightness: '32,000 Lumens', resolution: '4K UHD (3840x2160)', source: 'Laser Phosphor' }
      },
      {
        name: 'Projecta 16:9 Fast-Fold Screen (14x8ft)',
        category: 'Video',
        description: 'Heavy duty modular screen for front/rear projection setup.',
        daily_rate: 8000.00,
        total_quantity: 4,
        image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300&auto=format&fit=crop',
        specifications: { ratio: '16:9', dimensions: '14ft x 8ft', material: 'Matte White Front / Da-Tex Rear' }
      },
      {
        name: 'Absen PL3.9 Pro LED Panel',
        category: 'Video',
        description: '3.9mm pixel pitch high-refresh rate indoor/outdoor LED screen panels (price per panel).',
        daily_rate: 1500.00,
        total_quantity: 200,
        image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=300&auto=format&fit=crop',
        specifications: { pixelPitch: '3.9mm', brightness: '1200 nits', panelSize: '500 x 500 mm', refreshRate: '3840Hz' }
      },
      {
        name: 'Samsung 65" 4K Display Monitor',
        category: 'Video',
        description: 'Professional commercial grade 4K display panel with table stand or truss mount.',
        daily_rate: 8000.00,
        total_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=300&auto=format&fit=crop',
        specifications: { size: '65 inch', resolution: '4K UHD', inputs: '3 x HDMI, DisplayPort' }
      },
      {
        name: 'Robe MegaPointe Moving Head Beam/Spot',
        category: 'Lighting',
        description: 'Super bright hybrid discharge fixture capable of beams, spots, and washes.',
        daily_rate: 7500.00,
        total_quantity: 16,
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300&auto=format&fit=crop',
        specifications: { lamp: 'Osram Sirius HRI 470W', control: 'DMX512, RDM', zoomRange: '1.8 - 42 degrees' }
      },
      {
        name: 'Chauvet DJ Freedom Par Uplight',
        category: 'Lighting',
        description: '100% wireless, battery-operated RGBAW+UV LED par wash light with built-in transceiver.',
        daily_rate: 1000.00,
        total_quantity: 48,
        image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop',
        specifications: { batteryLife: 'Up to 20 hours', control: 'Wireless DMX, IR Remote', leds: '4 x 10W' }
      },
      {
        name: 'GrandMA3 Compact XT Console',
        category: 'Lighting',
        description: 'Professional lighting control console offering full control capability in a compact frame.',
        daily_rate: 25000.00,
        total_quantity: 2,
        image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        specifications: { parameters: 4096, screens: '2 x multi-touch screens', protocol: 'MAnet3, sACN, Art-Net' }
      },
      {
        name: 'Chauvet Ovation E-260WW Leko',
        category: 'Lighting',
        description: 'High power warm white LED ellipsoidal/profile spotlight for stage key lighting.',
        daily_rate: 3500.00,
        total_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop',
        specifications: { ledPower: '230W', colorTemp: '3200K Warm White', lens: '19, 26, or 36 degree options' }
      },
      {
        name: "Steeldeck 4' x 8' Stage Platform Deck",
        category: 'Stage',
        description: 'Heavy duty steel framed stage platform, adjustable heights (1ft, 2ft, or 3ft).',
        daily_rate: 1500.00,
        total_quantity: 32,
        image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=300&auto=format&fit=crop',
        specifications: { size: "4ft x 8ft", frame: 'Steel tube', loadCapacity: '150 lbs/sq.ft' }
      },
      {
        name: 'Prolyte H30V Heavy Duty Truss (10ft)',
        category: 'Stage',
        description: 'Four-point square truss segment for lighting suspension rigging.',
        daily_rate: 1000.00,
        total_quantity: 24,
        image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=300&auto=format&fit=crop',
        specifications: { segmentLength: '10ft (3m)', profile: '290mm x 290mm square', alloy: 'EN AW 6082 T6' }
      },
      {
        name: 'Apple MacBook Pro 16" (M3 Pro)',
        category: 'Computing',
        description: 'Premium laptop for presentation slide decks, media playback, and live production feeds.',
        daily_rate: 6000.00,
        total_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300&auto=format&fit=crop',
        specifications: { cpu: 'Apple M3 Pro', memory: '36GB Unified RAM', storage: '512GB SSD', displays: 'Liquid Retina XDR' }
      },
      {
        name: 'Apple iPad Pro 12.9" with Floor Stand',
        category: 'Computing',
        description: 'iPad Pro with robust floor kiosks for guest check-in, audience surveys, or display kiosks.',
        daily_rate: 2500.00,
        total_quantity: 20,
        image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=300&auto=format&fit=crop',
        specifications: { size: '12.9 inch', display: 'Liquid Retina', connection: 'Wi-Fi' }
      }
    ];

    for (const item of equipment) {
      await db.query(
        'INSERT INTO equipment (name, category, description, daily_rate, total_quantity, image_url, specifications, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.category, item.description, item.daily_rate, item.total_quantity, item.image_url, JSON.stringify(item.specifications), 'active']
      );
    }

    console.log('Equipment seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();

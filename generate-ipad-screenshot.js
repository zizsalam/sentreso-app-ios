const fs = require('fs');
const { createCanvas } = require('canvas');

// Create canvas with exact iPad 13" dimensions
const width = 2048;
const height = 2732;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#f8fafc';
ctx.fillRect(0, 0, width, height);

// iPad border
ctx.fillStyle = '#1f2937';
ctx.fillRect(0, 0, width, height);
ctx.fillStyle = '#f8fafc';
ctx.fillRect(8, 8, width - 16, height - 16);

// Status bar
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, width, 60);
ctx.fillStyle = '#1f2937';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('9:41', 40, 35);
ctx.textAlign = 'center';
ctx.fillText('Sentreso Finance', width / 2, 35);
ctx.textAlign = 'right';
ctx.fillText('100%', width - 40, 35);

// Header gradient
const gradient = ctx.createLinearGradient(0, 60, 0, 200);
gradient.addColorStop(0, '#10b981');
gradient.addColorStop(1, '#059669');
ctx.fillStyle = gradient;
ctx.fillRect(0, 60, width, 140);

// Welcome text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Bonjour, 👋', 40, 120);

// Balance section
ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.fillText('Solde Total', 40, 160);

ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('1,250,000 FCFA', 40, 200);

ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.fillText('📈 +12% ce mois', 40, 220);

// Main content area
ctx.fillStyle = '#ffffff';
ctx.fillRect(40, 240, width - 80, height - 340);

// Stats cards
const cardWidth = (width - 120) / 2;
const cardHeight = 120;

// Income card
ctx.fillStyle = '#ffffff';
ctx.fillRect(60, 280, cardWidth, cardHeight);
ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 4;

// Income icon
ctx.fillStyle = '#d1fae5';
ctx.fillRect(80, 300, 48, 48);
ctx.fillStyle = '#10b981';
ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('📈', 104, 330);

// Income text
ctx.fillStyle = '#374151';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Revenus', 140, 320);

ctx.fillStyle = '#10b981';
ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('+850,000 FCFA', 140, 350);

ctx.fillStyle = '#6b7280';
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Ce mois', 140, 370);

// Expense card
ctx.fillStyle = '#ffffff';
ctx.fillRect(60 + cardWidth + 20, 280, cardWidth, cardHeight);

// Expense icon
ctx.fillStyle = '#fee2e2';
ctx.fillRect(80 + cardWidth + 20, 300, 48, 48);
ctx.fillStyle = '#ef4444';
ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('📉', 104 + cardWidth + 20, 330);

// Expense text
ctx.fillStyle = '#374151';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Dépenses', 140 + cardWidth + 20, 320);

ctx.fillStyle = '#ef4444';
ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('-320,000 FCFA', 140 + cardWidth + 20, 350);

ctx.fillStyle = '#6b7280';
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Ce mois', 140 + cardWidth + 20, 370);

// Action buttons
const buttonWidth = (width - 120) / 2;
const buttonHeight = 60;

// Primary button
const gradient2 = ctx.createLinearGradient(60, 440, 60 + buttonWidth, 440);
gradient2.addColorStop(0, '#10b981');
gradient2.addColorStop(1, '#059669');
ctx.fillStyle = gradient2;
ctx.fillRect(60, 440, buttonWidth, buttonHeight);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('➕ Nouvelle Transaction', 60 + buttonWidth / 2, 475);

// Secondary button
ctx.fillStyle = '#ffffff';
ctx.fillRect(60 + buttonWidth + 20, 440, buttonWidth, buttonHeight);
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 2;
ctx.strokeRect(60 + buttonWidth + 20, 440, buttonWidth, buttonHeight);

ctx.fillStyle = '#6366f1';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('📊 Voir les Stats', 60 + buttonWidth + 20 + buttonWidth / 2, 475);

// Voice feature
ctx.fillStyle = '#ffffff';
ctx.fillRect(60, 540, width - 120, 80);

// Voice icon
ctx.fillStyle = '#d1fae5';
ctx.fillRect(80, 560, 64, 64);

ctx.fillStyle = '#10b981';
ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('🎤', 112, 600);

// Voice text
ctx.fillStyle = '#1f2937';
ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('🎤 Créer un reçu vocal', 160, 580);

ctx.fillStyle = '#6b7280';
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Parlez pour générer un reçu en 5 secondes', 160, 600);

// Transactions section
ctx.fillStyle = '#ffffff';
ctx.fillRect(60, 660, width - 120, 400);

ctx.fillStyle = '#1f2937';
ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Transactions Récentes', 80, 700);

// Transaction items
const transactions = [
    { type: 'income', title: 'Salaire', category: 'Revenus', amount: '+450,000 FCFA', date: 'Aujourd\'hui' },
    { type: 'expense', title: 'Courses Supermarché', category: 'Alimentation', amount: '-85,000 FCFA', date: 'Hier' },
    { type: 'income', title: 'Freelance', category: 'Revenus', amount: '+200,000 FCFA', date: 'Il y a 2 jours' },
    { type: 'expense', title: 'Essence', category: 'Transport', amount: '-45,000 FCFA', date: 'Il y a 3 jours' }
];

let yPos = 740;
transactions.forEach((transaction, index) => {
    // Transaction icon
    ctx.fillStyle = transaction.type === 'income' ? '#d1fae5' : '#fee2e2';
    ctx.fillRect(80, yPos, 56, 56);

    ctx.fillStyle = transaction.type === 'income' ? '#10b981' : '#ef4444';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(transaction.type === 'income' ? '📈' : '📉', 108, yPos + 35);

    // Transaction details
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(transaction.title, 160, yPos + 20);

    ctx.fillStyle = '#6b7280';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(transaction.category, 160, yPos + 40);

    // Transaction amount
    ctx.fillStyle = transaction.type === 'income' ? '#10b981' : '#ef4444';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(transaction.amount, width - 80, yPos + 20);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(transaction.date, width - 80, yPos + 40);

    yPos += 80;
});

// Tab bar
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, height - 100, width, 100);
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 1;
ctx.strokeRect(0, height - 100, width, 1);

const tabs = [
    { icon: '🏠', text: 'Accueil', active: true },
    { icon: '➕', text: 'Ajouter', active: false },
    { icon: '📊', text: 'Analytics', active: false },
    { icon: '🎤', text: 'Voix', active: false }
];

const tabWidth = width / 4;
tabs.forEach((tab, index) => {
    const x = index * tabWidth;
    ctx.fillStyle = tab.active ? '#10b981' : '#6b7280';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tab.icon, x + tabWidth / 2, height - 60);

    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(tab.text, x + tabWidth / 2, height - 30);
});

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('sentreso-finance-ipad-13inch.png', buffer);

console.log('✅ Screenshot généré avec succès !');
console.log('📁 Fichier : sentreso-finance-ipad-13inch.png');
console.log('📏 Dimensions : 2048 × 2732px');
console.log('📱 Format : PNG pour iPad 13" App Store');

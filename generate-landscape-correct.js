const fs = require('fs');
const { createCanvas } = require('canvas');

// Dimensions iPad CORRECTES - 2868 × 1320px (Landscape)
const width = 2868;
const height = 1320;

// Create canvas
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
ctx.fillRect(8, 8, width - 16, 60);

// Status bar text
ctx.fillStyle = '#1f2937';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('9:41', 48, 45);
ctx.textAlign = 'center';
ctx.fillText('Sentreso Finance', width / 2, 45);
ctx.textAlign = 'right';
ctx.fillText('100%', width - 48, 45);

// Header gradient
const headerGradient = ctx.createLinearGradient(8, 68, 8, 200);
headerGradient.addColorStop(0, '#10b981');
headerGradient.addColorStop(1, '#059669');
ctx.fillStyle = headerGradient;
ctx.fillRect(8, 68, width - 16, 132);

// Welcome text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Bonjour, 👋', 48, 120);

// Balance section
ctx.textAlign = 'right';
ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Solde Total', width - 48, 100);
ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('1,250,000 FCFA', width - 48, 150);
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('📈 +12% ce mois', width - 48, 180);

// Main content area - LANDSCAPE LAYOUT
const contentY = 200;
const contentHeight = height - contentY - 8;

// Left panel (Stats and Actions)
const leftPanelWidth = (width - 96) / 2;
const leftPanelX = 48;

// Stats cards
const cardWidth = (leftPanelWidth - 24) / 2;
const cardHeight = 120;

// First card (Income)
ctx.fillStyle = '#ffffff';
ctx.fillRect(leftPanelX, contentY + 40, cardWidth, cardHeight);
ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 4;

// Income card content
ctx.fillStyle = '#10b981';
ctx.fillRect(leftPanelX + 24, contentY + 40 + 24, 48, 48);
ctx.fillStyle = '#ffffff';
ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('📈', leftPanelX + 24 + 24, contentY + 40 + 24 + 32);

ctx.fillStyle = '#374151';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Revenus', leftPanelX + 24 + 60, contentY + 40 + 24 + 20);

ctx.fillStyle = '#10b981';
ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('+850,000 FCFA', leftPanelX + 24, contentY + 40 + 24 + 60);

ctx.fillStyle = '#6b7280';
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Ce mois', leftPanelX + 24, contentY + 40 + 24 + 80);

// Second card (Expense)
ctx.fillStyle = '#ffffff';
ctx.fillRect(leftPanelX + cardWidth + 24, contentY + 40, cardWidth, cardHeight);

// Expense card content
ctx.fillStyle = '#ef4444';
ctx.fillRect(leftPanelX + cardWidth + 24 + 24, contentY + 40 + 24, 48, 48);
ctx.fillStyle = '#ffffff';
ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('📉', leftPanelX + cardWidth + 24 + 24 + 24, contentY + 40 + 24 + 32);

ctx.fillStyle = '#374151';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Dépenses', leftPanelX + cardWidth + 24 + 24 + 60, contentY + 40 + 24 + 20);

ctx.fillStyle = '#ef4444';
ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('-320,000 FCFA', leftPanelX + cardWidth + 24 + 24, contentY + 40 + 24 + 60);

ctx.fillStyle = '#6b7280';
ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Ce mois', leftPanelX + cardWidth + 24 + 24, contentY + 40 + 24 + 80);

// Action buttons
const buttonY = contentY + 40 + cardHeight + 40;
const buttonWidth = (leftPanelWidth - 24) / 2;
const buttonHeight = 60;

// Primary button
const primaryGradient = ctx.createLinearGradient(leftPanelX, buttonY, leftPanelX, buttonY + buttonHeight);
primaryGradient.addColorStop(0, '#10b981');
primaryGradient.addColorStop(1, '#059669');
ctx.fillStyle = primaryGradient;
ctx.fillRect(leftPanelX, buttonY, buttonWidth, buttonHeight);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('➕ Nouvelle Transaction', leftPanelX + buttonWidth / 2, buttonY + 35);

// Secondary button
ctx.fillStyle = '#ffffff';
ctx.fillRect(leftPanelX + buttonWidth + 24, buttonY, buttonWidth, buttonHeight);
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 2;
ctx.strokeRect(leftPanelX + buttonWidth + 24, buttonY, buttonWidth, buttonHeight);

ctx.fillStyle = '#6366f1';
ctx.fillText('📊 Voir les Stats', leftPanelX + buttonWidth + 24 + buttonWidth / 2, buttonY + 35);

// Voice feature
const voiceY = buttonY + buttonHeight + 24;
ctx.fillStyle = '#ffffff';
ctx.fillRect(leftPanelX, voiceY, leftPanelWidth, 80);

ctx.fillStyle = '#d1fae5';
ctx.fillRect(leftPanelX + 24, voiceY + 24, 56, 56);

ctx.fillStyle = '#10b981';
ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('🎤', leftPanelX + 24 + 28, voiceY + 24 + 36);

ctx.fillStyle = '#1f2937';
ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('🎤 Créer un reçu vocal', leftPanelX + 24 + 56 + 20, voiceY + 24 + 20);

ctx.fillStyle = '#6b7280';
ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.fillText('Parlez pour générer un reçu en 5 secondes', leftPanelX + 24 + 56 + 20, voiceY + 24 + 40);

ctx.fillStyle = '#1f2937';
ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'right';
ctx.fillText('➡️', leftPanelX + leftPanelWidth - 24, voiceY + 24 + 36);

// Right panel (Transactions)
const rightPanelX = leftPanelX + leftPanelWidth + 48;
const rightPanelWidth = width - rightPanelX - 48;

ctx.fillStyle = '#ffffff';
ctx.fillRect(rightPanelX, contentY + 40, rightPanelWidth, contentHeight - 40);

ctx.fillStyle = '#1f2937';
ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('Transactions Récentes', rightPanelX + 32, contentY + 40 + 32);

// Transaction items
const transactionItems = [
    { type: 'income', title: 'Salaire', category: 'Revenus', amount: '+450,000 FCFA', date: 'Aujourd\'hui' },
    { type: 'expense', title: 'Courses Supermarché', category: 'Alimentation', amount: '-85,000 FCFA', date: 'Hier' },
    { type: 'income', title: 'Freelance', category: 'Revenus', amount: '+200,000 FCFA', date: 'Il y a 2 jours' },
    { type: 'expense', title: 'Essence', category: 'Transport', amount: '-45,000 FCFA', date: 'Il y a 3 jours' }
];

let currentY = contentY + 40 + 80;
transactionItems.forEach((item, index) => {
    // Transaction icon
    const iconColor = item.type === 'income' ? '#10b981' : '#ef4444';
    const iconBg = item.type === 'income' ? '#d1fae5' : '#fee2e2';

    ctx.fillStyle = iconBg;
    ctx.fillRect(rightPanelX + 32, currentY, 48, 48);

    ctx.fillStyle = iconColor;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.type === 'income' ? '📈' : '📉', rightPanelX + 32 + 24, currentY + 30);

    // Transaction details
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.title, rightPanelX + 32 + 48 + 20, currentY + 20);

    ctx.fillStyle = '#6b7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(item.category, rightPanelX + 32 + 48 + 20, currentY + 40);

    // Transaction amount
    ctx.fillStyle = item.type === 'income' ? '#10b981' : '#ef4444';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.amount, rightPanelX + rightPanelWidth - 32, currentY + 20);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(item.date, rightPanelX + rightPanelWidth - 32, currentY + 40);

    // Separator line (except for last item)
    if (index < transactionItems.length - 1) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(rightPanelX + 32, currentY + 48, rightPanelWidth - 64, 1);
    }

    currentY += 80;
});

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('sentreso-finance-ipad-landscape-correct.png', buffer);

console.log('✅ Screenshot LANDSCAPE avec BONNES dimensions généré !');
console.log('📁 Fichier : sentreso-finance-ipad-landscape-correct.png');
console.log('📏 Dimensions : 2868 × 1320px (LANDSCAPE CORRECT)');
console.log('🎯 Prêt pour App Store Connect');
console.log('✅ Dimensions respectées : 2868 × 1320px');

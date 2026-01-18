/**
 * Tea With God - Marketing Chatbot
 * Pre-empted responses with action buttons
 * No AI required - decision tree based
 * Supports i18n translations
 */

(function() {
  'use strict';

  // ============================================
  // CHATBOT KNOWLEDGE BASE
  // ============================================

  const KNOWLEDGE = {
    // Product Info
    product: {
      name: 'Tea With God',
      tagline: 'A 40-Day Devotional Companion for Women',
      description: 'A gentle devotional journey combining faith-based wisdom with evidence-based psychology. Perfect for women going through emotional recovery, relationship restoration, and spiritual growth.',
      author: 'Lani Butler',
      duration: '40 days',
      format: 'Web App (PWA) - works on any device'
    },

    // Pricing
    pricing: {
      book: { price: 'R99', description: 'Digital book only - all 40 devotionals' },
      journey: { price: 'R149', description: 'Book + App with journal and progress tracking', recommended: true },
      premium: { price: 'R249', description: 'Everything including brain games, audio, and bonus content' }
    },

    // Brain Games
    brainGames: [
      { name: 'Breathe With God', science: 'Polyvagal Theory', benefit: 'Calms your nervous system in 2 minutes' },
      { name: 'Gratitude Garden', science: 'Positive Psychology', benefit: 'Rewires your brain for positivity' },
      { name: 'Thought Detective', science: 'Cognitive Behavioral Therapy', benefit: 'Identifies and reframes negative thought patterns' },
      { name: 'Scripture Palace', science: 'Method of Loci', benefit: 'Memorize Scripture 3x faster' },
      { name: 'Body Scan Release', science: 'Somatic Experiencing', benefit: 'Release stored tension and trauma' },
      { name: 'Pattern Peace', science: 'Working Memory Training', benefit: 'Improves focus and mental clarity' }
    ],

    // FAQs
    faqs: {
      'what-is-twg': {
        question: 'What is Tea With God?',
        answer: 'Tea With God is a 40-day devotional companion designed specifically for women. It combines daily devotionals with evidence-based brain exercises (we call them "brain games") to help you grow emotionally, spiritually, and mentally. Think of it as your daily cup of tea with God - a quiet moment of reflection, growth, and restoration.'
      },
      'who-is-it-for': {
        question: 'Who is this for?',
        answer: 'Tea With God is for any woman seeking growth - whether from heartbreak, loss, anxiety, depression, trauma, or simply feeling stuck. It\'s especially helpful for:\n\n• Women recovering from difficult relationships\n• Those struggling with anxiety or negative thoughts\n• Anyone wanting to deepen their faith during challenging times\n• Women who\'ve tried therapy and want additional support\n• Church groups and women\'s ministries'
      },
      'how-it-works': {
        question: 'How does it work?',
        answer: 'Each day for 40 days, you\'ll receive:\n\n1. A devotional reading with Scripture\n2. A reflection prompt for journaling\n3. A prayer to guide your conversation with God\n4. Access to brain games that reinforce growth\n\nThe app works offline, respects your privacy (journal stays on your device), and tracks your progress through the journey.'
      },
      'science-behind': {
        question: 'What\'s the science behind it?',
        answer: 'Our brain games are based on peer-reviewed research:\n\n• Polyvagal Theory - nervous system regulation\n• Cognitive Behavioral Therapy (CBT) - thought pattern change\n• Positive Psychology - gratitude\'s effect on the brain\n• Somatic Experiencing - trauma release\n• Method of Loci - proven memory technique\n\nWe combine faith with science because God created both.'
      },
      'is-it-therapy': {
        question: 'Is this therapy?',
        answer: 'No, Tea With God is not therapy and doesn\'t replace professional mental health treatment. It\'s an educational and devotional resource that uses evidence-based techniques. If you\'re in crisis or need clinical support, please seek help from a licensed professional. Our app includes crisis resources for those who need them.'
      },
      'offline-access': {
        question: 'Does it work offline?',
        answer: 'Yes! Once you\'ve loaded the app, it works completely offline. This is especially important for women in areas with limited internet access. Your journal and progress are stored securely on your device.'
      },
      'privacy': {
        question: 'Is my journal private?',
        answer: 'Absolutely. Your journal entries NEVER leave your device. We can\'t read them, and they\'re not stored in any cloud. Your devotional journey is between you and God. The only data we see (if you opt in) is anonymous usage statistics to improve the app.'
      },
      'refund': {
        question: 'What if it\'s not for me?',
        answer: 'We offer a 7-day satisfaction guarantee. If Tea With God isn\'t right for you, email us within 7 days of purchase for a full refund. No questions asked. We want you to feel completely comfortable trying this journey.'
      },
      'church-bulk': {
        question: 'Can our church/organization get bulk access?',
        answer: 'Yes! We offer special pricing for churches, counseling centers, shelters, and other organizations. Visit our B2B page or contact us for bulk access codes. We believe spiritual support should be accessible to every woman, regardless of her circumstances.'
      },
      'how-long': {
        question: 'How long do I have access?',
        answer: 'Lifetime access. Once you purchase, the content is yours forever. No subscriptions, no recurring fees. You can go through the 40 days as many times as you need.'
      }
    }
  };

  // ============================================
  // TRANSLATION HELPER
  // ============================================

  function t(key) {
    if (typeof i18n !== 'undefined' && i18n.t) {
      const translation = i18n.t(key);
      // If translation returns the key itself, fall back to key
      return translation !== key ? translation : key.split('.').pop();
    }
    return key.split('.').pop();
  }

  // ============================================
  // CONVERSATION FLOWS (using i18n)
  // ============================================

  function getFlows() {
    return {
      welcome: {
        message: t('chatbot.welcome'),
        buttons: [
          { label: t('chatbot.buttons.whatIsTwg'), action: 'faq', value: 'what-is-twg' },
          { label: t('chatbot.buttons.whoIsItFor'), action: 'faq', value: 'who-is-it-for' },
          { label: t('chatbot.buttons.seePricing'), action: 'pricing' },
          { label: t('chatbot.buttons.brainGames'), action: 'brainGames' }
        ]
      },

      afterFaq: {
        message: t('chatbot.flows.afterFaq'),
        buttons: [
          { label: t('chatbot.buttons.howDoesItWork'), action: 'faq', value: 'how-it-works' },
          { label: t('chatbot.buttons.whatsTheScience'), action: 'faq', value: 'science-behind' },
          { label: t('chatbot.buttons.seePricing'), action: 'pricing' },
          { label: t('chatbot.buttons.readyToStart'), action: 'checkout' }
        ]
      },

      afterPricing: {
        message: t('chatbot.flows.afterPricing'),
        buttons: [
          { label: t('chatbot.buttons.whatsInJourney'), action: 'explainJourney' },
          { label: t('chatbot.buttons.refundPolicy'), action: 'faq', value: 'refund' },
          { label: t('chatbot.buttons.readyToOrder'), action: 'checkout' },
          { label: t('chatbot.buttons.tellMeMore'), action: 'moreInfo' }
        ]
      },

      afterBrainGames: {
        message: t('chatbot.flows.afterBrainGames'),
        buttons: [
          { label: t('chatbot.buttons.whatsTheScience'), action: 'faq', value: 'science-behind' },
          { label: t('chatbot.buttons.refundPolicy'), action: 'faq', value: 'is-it-therapy' },
          { label: t('chatbot.buttons.seePricing'), action: 'pricing' },
          { label: t('chatbot.buttons.readyToStart'), action: 'checkout' }
        ]
      },

      moreInfo: {
        message: t('chatbot.flows.moreInfo'),
        buttons: [
          { label: t('chatbot.buttons.privacySecurity'), action: 'faq', value: 'privacy' },
          { label: t('chatbot.buttons.offlineAccess'), action: 'faq', value: 'offline-access' },
          { label: t('chatbot.buttons.churchBulk'), action: 'faq', value: 'church-bulk' },
          { label: t('chatbot.buttons.howLongAccess'), action: 'faq', value: 'how-long' }
        ]
      },

      explainJourney: {
        message: t('chatbot.explainJourney'),
        buttons: [
          { label: t('chatbot.buttons.whatAboutPremium'), action: 'explainPremium' },
          { label: t('chatbot.buttons.compareAllTiers'), action: 'pricing' },
          { label: t('chatbot.buttons.getJourneyTier'), action: 'checkout', value: 'journey' }
        ]
      },

      explainPremium: {
        message: t('chatbot.explainPremium'),
        buttons: [
          { label: t('chatbot.buttons.brainGames'), action: 'brainGames' },
          { label: t('chatbot.buttons.compareAllTiers'), action: 'pricing' },
          { label: t('chatbot.buttons.getPremiumTier'), action: 'checkout', value: 'premium' }
        ]
      },

      preCheckout: {
        message: t('chatbot.flows.preCheckout'),
        buttons: [
          { label: t('chatbot.buttons.bookOnly'), action: 'checkout', value: 'book' },
          { label: t('chatbot.buttons.journeyRecommended'), action: 'checkout', value: 'journey' },
          { label: t('chatbot.buttons.premiumTier'), action: 'checkout', value: 'premium' },
          { label: t('chatbot.buttons.moreQuestions'), action: 'moreInfo' }
        ]
      }
    };
  }

  // ============================================
  // CHATBOT UI
  // ============================================

  const STYLES = `
    #twg-chatbot-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    #twg-chat-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    #twg-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(212, 175, 55, 0.5);
    }

    #twg-chat-toggle svg {
      width: 28px;
      height: 28px;
      fill: #0D0D0D;
    }

    #twg-chat-toggle .close-icon {
      display: none;
    }

    #twg-chat-toggle.open .chat-icon {
      display: none;
    }

    #twg-chat-toggle.open .close-icon {
      display: block;
    }

    #twg-chat-window {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #1A1A1A;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    #twg-chat-window.open {
      display: flex;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    #twg-chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #twg-chat-header img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      background: #0D0D0D;
      padding: 4px;
    }

    #twg-chat-header-info h4 {
      color: #0D0D0D;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    #twg-chat-header-info span {
      color: rgba(13, 13, 13, 0.7);
      font-size: 0.75rem;
    }

    #twg-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .twg-message {
      max-width: 85%;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .twg-message.bot {
      align-self: flex-start;
    }

    .twg-message.user {
      align-self: flex-end;
    }

    .twg-message-content {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 0.9rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .twg-message.bot .twg-message-content {
      background: rgba(255, 255, 255, 0.08);
      color: #FAFAFA;
      border-bottom-left-radius: 4px;
    }

    .twg-message.user .twg-message-content {
      background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
      color: #0D0D0D;
      border-bottom-right-radius: 4px;
    }

    .twg-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .twg-btn {
      padding: 10px 16px;
      border: 1px solid rgba(212, 175, 55, 0.5);
      background: rgba(212, 175, 55, 0.1);
      color: #D4AF37;
      border-radius: 20px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .twg-btn:hover {
      background: #D4AF37;
      color: #0D0D0D;
      border-color: #D4AF37;
    }

    .twg-btn.primary {
      background: #D4AF37;
      color: #0D0D0D;
      border-color: #D4AF37;
    }

    .twg-btn.primary:hover {
      background: #F4E4BC;
      border-color: #F4E4BC;
    }

    #twg-chat-input-area {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 8px;
    }

    #twg-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: #FAFAFA;
      border-radius: 24px;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    #twg-chat-input:focus {
      border-color: rgba(212, 175, 55, 0.5);
    }

    #twg-chat-input::placeholder {
      color: rgba(250, 250, 250, 0.4);
    }

    #twg-chat-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #D4AF37;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    #twg-chat-send:hover {
      background: #F4E4BC;
    }

    #twg-chat-send svg {
      width: 20px;
      height: 20px;
      fill: #0D0D0D;
    }

    /* Typing indicator */
    .twg-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      width: fit-content;
    }

    .twg-typing span {
      width: 8px;
      height: 8px;
      background: rgba(250, 250, 250, 0.4);
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .twg-typing span:nth-child(2) { animation-delay: 0.2s; }
    .twg-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Special content styling */
    .twg-pricing-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin: 8px 0;
    }

    .twg-pricing-card.recommended {
      border-color: rgba(212, 175, 55, 0.5);
      background: rgba(212, 175, 55, 0.1);
    }

    .twg-pricing-card h5 {
      color: #D4AF37;
      font-size: 0.85rem;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .twg-pricing-card .price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FAFAFA;
      margin-bottom: 4px;
    }

    .twg-pricing-card p {
      font-size: 0.8rem;
      color: rgba(250, 250, 250, 0.6);
      margin: 0;
    }

    .twg-badge {
      display: inline-block;
      background: #D4AF37;
      color: #0D0D0D;
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      font-weight: 600;
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      #twg-chat-window {
        width: calc(100vw - 24px);
        right: -12px;
        bottom: 68px;
        height: calc(100vh - 100px);
      }

      #twg-chatbot-container {
        bottom: 16px;
        right: 16px;
      }

      #twg-chat-toggle {
        width: 56px;
        height: 56px;
      }
    }
  `;

  // ============================================
  // CHATBOT LOGIC
  // ============================================

  class TWGChatbot {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.init();
    }

    init() {
      this.injectStyles();
      this.createUI();
      this.bindEvents();

      // Show welcome after short delay
      setTimeout(() => {
        this.showFlow('welcome');
      }, 500);

      // Listen for language changes
      window.addEventListener('languageChanged', () => {
        this.updateUITexts();
      });
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    createUI() {
      const container = document.createElement('div');
      container.id = 'twg-chatbot-container';
      container.innerHTML = `
        <div id="twg-chat-window">
          <div id="twg-chat-header">
            <img src="images/teacup.png" alt="Tea With God" onerror="this.style.display='none'">
            <div id="twg-chat-header-info">
              <h4 id="twg-chat-title">${t('chatbot.header.title')}</h4>
              <span id="twg-chat-subtitle">${t('chatbot.header.subtitle')}</span>
            </div>
          </div>
          <div id="twg-chat-messages"></div>
          <div id="twg-chat-input-area">
            <input type="text" id="twg-chat-input" placeholder="${t('chatbot.placeholder')}">
            <button id="twg-chat-send">
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
        <button id="twg-chat-toggle">
          <svg class="chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          <svg class="close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      `;
      document.body.appendChild(container);

      this.elements = {
        container,
        window: container.querySelector('#twg-chat-window'),
        toggle: container.querySelector('#twg-chat-toggle'),
        messages: container.querySelector('#twg-chat-messages'),
        input: container.querySelector('#twg-chat-input'),
        send: container.querySelector('#twg-chat-send')
      };
    }

    updateUITexts() {
      // Update header texts
      const title = document.getElementById('twg-chat-title');
      const subtitle = document.getElementById('twg-chat-subtitle');
      const input = document.getElementById('twg-chat-input');

      if (title) title.textContent = t('chatbot.header.title');
      if (subtitle) subtitle.textContent = t('chatbot.header.subtitle');
      if (input) input.placeholder = t('chatbot.placeholder');
    }

    bindEvents() {
      this.elements.toggle.addEventListener('click', () => this.toggle());
      this.elements.send.addEventListener('click', () => this.handleUserInput());
      this.elements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleUserInput();
      });
    }

    toggle() {
      this.isOpen = !this.isOpen;
      this.elements.window.classList.toggle('open', this.isOpen);
      this.elements.toggle.classList.toggle('open', this.isOpen);
    }

    addMessage(content, isBot = true, buttons = null) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `twg-message ${isBot ? 'bot' : 'user'}`;

      let html = `<div class="twg-message-content">${content}</div>`;

      if (buttons && buttons.length > 0) {
        html += '<div class="twg-buttons">';
        buttons.forEach((btn, i) => {
          const primaryClass = btn.label.includes('Recommended') || btn.label.includes('Aanbeveel') || btn.action === 'checkout' ? 'primary' : '';
          html += `<button class="twg-btn ${primaryClass}" data-action="${btn.action}" data-value="${btn.value || ''}">${btn.label}</button>`;
        });
        html += '</div>';
      }

      msgDiv.innerHTML = html;
      this.elements.messages.appendChild(msgDiv);
      this.scrollToBottom();

      // Bind button events
      msgDiv.querySelectorAll('.twg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const value = btn.dataset.value;
          this.handleAction(action, value, btn.textContent);
        });
      });
    }

    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'twg-message bot';
      typing.id = 'twg-typing';
      typing.innerHTML = '<div class="twg-typing"><span></span><span></span><span></span></div>';
      this.elements.messages.appendChild(typing);
      this.scrollToBottom();
    }

    hideTyping() {
      const typing = document.getElementById('twg-typing');
      if (typing) typing.remove();
    }

    scrollToBottom() {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    async showFlow(flowName) {
      const flows = getFlows();
      const flow = flows[flowName];
      if (!flow) return;

      this.showTyping();
      await this.delay(600);
      this.hideTyping();

      this.addMessage(flow.message, true, flow.buttons);
    }

    async handleAction(action, value, buttonText) {
      // Show user's selection
      this.addMessage(buttonText, false);

      await this.delay(300);

      const flows = getFlows();

      switch (action) {
        case 'faq':
          await this.showFaq(value);
          break;
        case 'pricing':
          await this.showPricing();
          break;
        case 'brainGames':
          await this.showBrainGames();
          break;
        case 'checkout':
          this.goToCheckout(value);
          break;
        case 'explainJourney':
          this.showTyping();
          await this.delay(600);
          this.hideTyping();
          this.addMessage(flows.explainJourney.message, true, flows.explainJourney.buttons);
          break;
        case 'explainPremium':
          this.showTyping();
          await this.delay(600);
          this.hideTyping();
          this.addMessage(flows.explainPremium.message, true, flows.explainPremium.buttons);
          break;
        case 'moreInfo':
          await this.showFlow('moreInfo');
          break;
        default:
          await this.showFlow('afterFaq');
      }
    }

    async showFaq(faqKey) {
      const faq = KNOWLEDGE.faqs[faqKey];
      if (!faq) {
        await this.showFlow('afterFaq');
        return;
      }

      this.showTyping();
      await this.delay(800);
      this.hideTyping();

      this.addMessage(faq.answer, true);

      await this.delay(500);
      await this.showFlow('afterFaq');
    }

    async showPricing() {
      this.showTyping();
      await this.delay(600);
      this.hideTyping();

      const pricingHtml = `${t('chatbot.pricing.intro')}\n
<div class="twg-pricing-card">
  <h5>${t('chatbot.pricing.bookOnly.title')}</h5>
  <div class="price">${t('chatbot.pricing.bookOnly.price')}</div>
  <p>${t('chatbot.pricing.bookOnly.desc')}</p>
</div>

<div class="twg-pricing-card recommended">
  <h5>${t('chatbot.pricing.journey.title')} <span class="twg-badge">${t('chatbot.pricing.journey.badge')}</span></h5>
  <div class="price">${t('chatbot.pricing.journey.price')}</div>
  <p>${t('chatbot.pricing.journey.desc')}</p>
</div>

<div class="twg-pricing-card">
  <h5>${t('chatbot.pricing.premium.title')}</h5>
  <div class="price">${t('chatbot.pricing.premium.price')}</div>
  <p>${t('chatbot.pricing.premium.desc')}</p>
</div>`;

      this.addMessage(pricingHtml, true);

      await this.delay(500);
      await this.showFlow('afterPricing');
    }

    async showBrainGames() {
      this.showTyping();
      await this.delay(800);
      this.hideTyping();

      let gamesHtml = t('chatbot.brainGamesIntro') + "\n\n";

      KNOWLEDGE.brainGames.forEach((game, i) => {
        gamesHtml += `<strong>${i + 1}. ${game.name}</strong>\n`;
        gamesHtml += `Based on: ${game.science}\n`;
        gamesHtml += `${game.benefit}\n\n`;
      });

      this.addMessage(gamesHtml.trim(), true);

      await this.delay(500);
      await this.showFlow('afterBrainGames');
    }

    goToCheckout(tier) {
      this.addMessage(t('chatbot.flows.goingToCheckout'), true);

      setTimeout(() => {
        const url = tier ? `checkout.html?tier=${tier}` : 'checkout.html';
        window.location.href = url;
      }, 1000);
    }

    handleUserInput() {
      const input = this.elements.input.value.trim();
      if (!input) return;

      this.elements.input.value = '';
      this.addMessage(input, false);

      // Simple keyword matching
      this.processUserMessage(input.toLowerCase());
    }

    async processUserMessage(message) {
      this.showTyping();
      await this.delay(800);
      this.hideTyping();

      // Keyword matching
      if (message.includes('price') || message.includes('cost') || message.includes('how much') || message.includes('prys') || message.includes('koste')) {
        await this.showPricing();
      } else if (message.includes('brain game') || message.includes('exercise') || message.includes('breinspeletjie') || message.includes('oefening')) {
        await this.showBrainGames();
      } else if (message.includes('refund') || message.includes('money back') || message.includes('terugbetaling')) {
        await this.showFaq('refund');
      } else if (message.includes('privacy') || message.includes('journal') || message.includes('private') || message.includes('privaat') || message.includes('joernaal')) {
        await this.showFaq('privacy');
      } else if (message.includes('church') || message.includes('bulk') || message.includes('organization') || message.includes('kerk') || message.includes('organisasie')) {
        await this.showFaq('church-bulk');
      } else if (message.includes('therapy') || message.includes('therapist') || message.includes('clinical') || message.includes('terapie')) {
        await this.showFaq('is-it-therapy');
      } else if (message.includes('offline') || message.includes('internet') || message.includes('vanlyn')) {
        await this.showFaq('offline-access');
      } else if (message.includes('science') || message.includes('research') || message.includes('evidence') || message.includes('wetenskap') || message.includes('navorsing')) {
        await this.showFaq('science-behind');
      } else if (message.includes('who') || message.includes('for me') || message.includes('wie') || message.includes('vir my')) {
        await this.showFaq('who-is-it-for');
      } else if ((message.includes('how') && message.includes('work')) || (message.includes('hoe') && message.includes('werk'))) {
        await this.showFaq('how-it-works');
      } else if (message.includes('buy') || message.includes('order') || message.includes('get') || message.includes('start') || message.includes('koop') || message.includes('bestel') || message.includes('begin')) {
        await this.showFlow('preCheckout');
      } else {
        // Default response
        const defaultButtons = [
          { label: t('chatbot.buttons.whatIsTwg'), action: 'faq', value: 'what-is-twg' },
          { label: t('chatbot.buttons.seePricing'), action: 'pricing' },
          { label: t('chatbot.buttons.brainGames'), action: 'brainGames' },
          { label: t('chatbot.buttons.readyToOrder'), action: 'checkout' }
        ];
        this.addMessage(t('chatbot.defaultResponse'), true, defaultButtons);
      }
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TWGChatbot());
  } else {
    new TWGChatbot();
  }
})();

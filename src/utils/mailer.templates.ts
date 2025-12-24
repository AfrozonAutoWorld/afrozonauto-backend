

export const newsletterSubscriptionTemplate = (
    email: string,
    preferences: {
        productUpdates: boolean;
        promotions: boolean;
        news: boolean;
        events: boolean;
    },
    organizationName: string
): string => {
    const getPreferenceText = (pref: boolean) => pref ? '✅ Enabled' : '❌ Disabled';

    return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title> ${organizationName} Newsletter Subscription Confirmation</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px 20px;
              text-align: center;
              color: white;
          }
          .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
          }
          .content {
              padding: 30px;
          }
          .welcome-text {
              font-size: 16px;
              margin-bottom: 25px;
              color: #555;
          }
          .preferences {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
          }
          .preferences h3 {
              margin-top: 0;
              color: #333;
              font-size: 18px;
          }
          .preference-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
          }
          .preference-item:last-child {
              border-bottom: none;
          }
          .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
          }
          .footer a {
              color: #667eea;
              text-decoration: none;
          }
          .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 600;
          }
          .divider {
              height: 1px;
              background-color: #e9ecef;
              margin: 25px 0;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🎉 Welcome to ${organizationName} Newsletter!</h1>
          </div>
          
          <div class="content">
              <div class="welcome-text">
                  <p>Hello there!</p>
                  <p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>
                  <p>You'll receive updates based on your preferences below. You can always manage your subscription settings anytime.</p>
              </div>
  
              <div class="preferences">
                  <h3>📋 Your Subscription Preferences</h3>
                  <div class="preference-item">
                      <span><strong>Product Updates:</strong></span>
                      <span>${getPreferenceText(preferences.productUpdates)}</span>
                  </div>
                  <div class="preference-item">
                      <span><strong>Promotions & Offers:</strong></span>
                      <span>${getPreferenceText(preferences.promotions)}</span>
                  </div>
                  <div class="preference-item">
                      <span><strong>News & Announcements:</strong></span>
                      <span>${getPreferenceText(preferences.news)}</span>
                  </div>
                  <div class="preference-item">
                      <span><strong>Events & Webinars:</strong></span>
                      <span>${getPreferenceText(preferences.events)}</span>
                  </div>
              </div>
  
  
              <div class="divider"></div>
  
              <p style="text-align: center; color: #666; font-size: 14px;">
                  If you didn't request this subscription or wish to unsubscribe, you can contact our support team: anoradev@support.com
              </p>
          </div>
          
          <div class="footer">
              <p>© ${new Date().getFullYear()} AnoraDevs. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
    `;
};
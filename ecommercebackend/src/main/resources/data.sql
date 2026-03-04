INSERT INTO public.email_templates ("name",body_html,body_text,created_by,created_dt,description,from_email,is_active,modified_by,modified_dt,subject,to_email,"type") VALUES
	 ('OTP Verification','<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Account</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: #007bff; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Verification</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Use the following one-time password (OTP) to verify your account:</p>
            <div class="otp-code">{{otp}}</div>
            <p>This code is valid for the next {{otp_expiry_minutes}} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 IotRoot. All rights reserved.</p>
        </div>
    </div>
</body>
</html>','Hello,

Use the following one-time password (OTP) to verify your account:

{{otp}}

This code is valid for the next {{otp_expiry_minutes}} minutes.

If you did not request this, please ignore this email.

Best regards,
IotRoot Team',0,'2026-02-25 16:27:31.496059','Email template used for sending OTP during account verification.',NULL,true,0,'2026-02-26 12:58:23.729764','Your Verification Code',NULL,'TRANSACTIONAL'),
	 ('Password Reset OTP','<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc3545; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Use the following OTP to reset your password:</p>
            <div class="otp-code">{{otp}}</div>
            <p>This code is valid for the next {{otp_expiry_minutes}} minutes.</p>
            <p>If you did not request this, please secure your account.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 IotRoot. All rights reserved.</p>
        </div>
    </div>
</body>
</html>','Hello,

Use the following OTP to reset your password:

{{otp}}

This code is valid for the next {{otp_expiry_minutes}} minutes.

If you did not request this, please secure your account.

Best regards,
IotRoot Team',0,'2026-02-25 16:27:31.500097','Email template used for password reset OTP.',NULL,true,0,'2026-02-26 12:58:23.731476','Your Password Reset Code',NULL,'TRANSACTIONAL');


INSERT INTO roles (role_code, landing_url, role_name)
VALUES
    ('ADMIN', '/admin/products', 'Administrator'),
    ('USER', '/shop', 'Customer')
ON CONFLICT (role_code) DO UPDATE
SET landing_url = EXCLUDED.landing_url,
    role_name = EXCLUDED.role_name;

INSERT INTO email_templates (
    name,
    from_email,
    to_email,
    subject,
    body_html,
    body_text,
    description,
    type,
    is_active,
    created_by,
    created_dt,
    modified_by,
    modified_dt
)
VALUES (
    'Password Reset OTP',
    null,
    null,
    'Your Password Reset Code',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc3545; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Use the following OTP to reset your password:</p>
            <div class="otp-code">{{otp}}</div>
            <p>This code is valid for the next {{otp_expiry_minutes}} minutes.</p>
            <p>If you did not request this, please secure your account.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 IotRoot. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Hello,

Use the following OTP to reset your password:

{{otp}}

This code is valid for the next {{otp_expiry_minutes}} minutes.

If you did not request this, please secure your account.

Best regards,
IotRoot Team',
    'Email template used for password reset OTP.',
    'TRANSACTIONAL',
    true,
    0,
    NOW(),
    0,
    NOW()
)
ON CONFLICT (name) DO UPDATE
SET subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active,
    modified_by = 0,
    modified_dt = NOW();

INSERT INTO email_templates (
    name,
    from_email,
    to_email,
    subject,
    body_html,
    body_text,
    description,
    type,
    is_active,
    created_by,
    created_dt,
    modified_by,
    modified_dt
)
VALUES (
    'Order Payment Success',
    null,
    null,
    'Payment Successful - {{order_number}}',
    $$<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Successful</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f6f8fb; margin: 0; padding: 16px;">
  <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
    <div style="background: #059669; color: #ffffff; padding: 18px 22px;">
      <h2 style="margin: 0;">Payment Received</h2>
      <p style="margin: 6px 0 0 0; font-size: 13px;">Order {{order_number}}</p>
    </div>
    <div style="padding: 20px 22px; color: #111827; font-size: 14px;">
      <p>Hello {{customer_name}},</p>
      <p>Your payment has been completed successfully.</p>
      <p><strong>Payment Status:</strong> {{payment_status}}</p>
      <p><strong>Payment ID:</strong> {{payment_id}}<br/>
      <strong>Payment Method:</strong> {{payment_method}}<br/>
      <strong>Gateway:</strong> {{payment_gateway}}</p>
      <p><strong>Order Subtotal:</strong> {{currency}} {{order_subtotal}}<br/>
      <strong>Shipping:</strong> {{currency}} {{shipping_fee}}<br/>
      <strong>Tax:</strong> {{currency}} {{tax_amount}}<br/>
      <strong>Discount:</strong> {{currency}} {{discount_amount}}<br/>
      <strong>Total Paid:</strong> {{currency}} {{order_total}}</p>
      <h3 style="margin-top: 18px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Qty</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {{items_html_rows}}
        </tbody>
      </table>
      <p style="margin-top: 16px;">Thank you for shopping with us.</p>
    </div>
  </div>
</body>
</html>$$,
    $$Hello {{customer_name}},

Your payment was completed successfully.

Order Number: {{order_number}}
Order ID: {{order_id}}
Order Date: {{order_date}}
Payment Status: {{payment_status}}
Payment ID: {{payment_id}}
Payment Method: {{payment_method}}
Gateway: {{payment_gateway}}

Order Subtotal: {{currency}} {{order_subtotal}}
Shipping: {{currency}} {{shipping_fee}}
Tax: {{currency}} {{tax_amount}}
Discount: {{currency}} {{discount_amount}}
Total Paid: {{currency}} {{order_total}}

Order Items:
{{items_text}}

Thank you for shopping with us.$$,
    'Email template sent to customer after successful payment with order item details.',
    'TRANSACTIONAL',
    true,
    0,
    NOW(),
    0,
    NOW()
)
ON CONFLICT (name) DO UPDATE
SET subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active,
    modified_by = 0,
    modified_dt = NOW();

INSERT INTO email_templates (
    name,
    from_email,
    to_email,
    subject,
    body_html,
    body_text,
    description,
    type,
    is_active,
    created_by,
    created_dt,
    modified_by,
    modified_dt
)
VALUES (
    'Order Payment Failed',
    null,
    null,
    'Payment Failed - {{order_number}}',
    $$<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Failed</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f6f8fb; margin: 0; padding: 16px;">
  <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
    <div style="background: #dc2626; color: #ffffff; padding: 18px 22px;">
      <h2 style="margin: 0;">Payment Failed</h2>
      <p style="margin: 6px 0 0 0; font-size: 13px;">Order {{order_number}}</p>
    </div>
    <div style="padding: 20px 22px; color: #111827; font-size: 14px;">
      <p>Hello {{customer_name}},</p>
      <p>We could not complete your payment for the order below.</p>
      <p><strong>Payment Status:</strong> {{payment_status}}<br/>
      <strong>Reason:</strong> {{failure_reason}}<br/>
      <strong>Payment ID:</strong> {{payment_id}}<br/>
      <strong>Payment Method:</strong> {{payment_method}}<br/>
      <strong>Gateway:</strong> {{payment_gateway}}</p>
      <p><strong>Order Total:</strong> {{currency}} {{order_total}}</p>
      <h3 style="margin-top: 18px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Qty</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {{items_html_rows}}
        </tbody>
      </table>
      <p style="margin-top: 16px;">Please retry the payment from your orders page.</p>
    </div>
  </div>
</body>
</html>$$,
    $$Hello {{customer_name}},

Your payment could not be completed.

Order Number: {{order_number}}
Order ID: {{order_id}}
Order Date: {{order_date}}
Payment Status: {{payment_status}}
Reason: {{failure_reason}}
Payment ID: {{payment_id}}
Payment Method: {{payment_method}}
Gateway: {{payment_gateway}}

Order Total: {{currency}} {{order_total}}

Order Items:
{{items_text}}

Please retry your payment from your orders page.$$,
    'Email template sent to customer after payment failure with order item details.',
    'TRANSACTIONAL',
    true,
    0,
    NOW(),
    0,
    NOW()
)
ON CONFLICT (name) DO UPDATE
SET subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active,
    modified_by = 0,
    modified_dt = NOW();

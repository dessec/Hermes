<?php
/**
 * OpenClaw Agent Console - Server Configuration
 * Place this file in your Namecheap public_html/ or app directory.
 */

// Default admin master password for the single private owner account
// Change this to your preferred secure passphrase
define('DEFAULT_PASSWORD', 'openclaw2025');

// Optional shared worker secret (leave blank or specify a secret string)
// If specified, the Kaggle worker must send header: X-Worker-Secret: your_secret_here
define('WORKER_SECRET', '');

// Default fixed model and agent
define('DEFAULT_MODEL', 'qwen3:14b-q4_K_M');
define('DEFAULT_AGENT', 'kaggle-strategist');

// Timezone
date_default_timezone_set('UTC');

#!/usr/bin/env node

import argon2 from 'argon2';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the password to hash: ', async (password) => {
  try {
    const hash = await argon2.hash(password);
    console.log('\n✅ Password hash generated:\n');
    console.log(hash);
    console.log('\nSet this as ADMIN_PASSWORD_HASH in your .env file\n');
    rl.close();
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
});

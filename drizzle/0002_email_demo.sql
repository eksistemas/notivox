INSERT OR IGNORE INTO users(id,username,salt,password_hash,role)
VALUES(-1,'teste@adnipo.example','email-only',lower(hex(randomblob(32))),'member');

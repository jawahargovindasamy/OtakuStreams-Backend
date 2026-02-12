import cryptoRandomString from 'crypto-random-string';

export const generateRandomPassword = (length = 12) => {
  return cryptoRandomString({
    length,
    type: 'alphanumeric',
  });
};

export const generateResetToken = () => {
  return cryptoRandomString({
    length: 32,
    type: 'url-safe',
  });
};
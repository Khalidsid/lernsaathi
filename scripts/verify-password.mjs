import bcrypt from 'bcryptjs';

const password = 'testpass123';
const hash = '$2b$12$67lRdD.1MdcqTN1FRAHwyeG7UzwQ7Ok4InNRfRGLjMGQm2YOXMEq2';

console.log('Testing password hash from .env...\n');
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);

const isValid = await bcrypt.compare(password, hash);
console.log(`\nResult: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

if (!isValid) {
  console.log('\n⚠️  The hash does NOT match "testpass123"');
  console.log('\nGenerating correct hash for "testpass123"...');
  const correctHash = await bcrypt.hash('testpass123', 12);
  console.log(`\nCorrect hash for "testpass123":\n${correctHash}`);

  console.log('\n\nTesting other commented hashes in .env:');
  const otherHashes = [
    '$2b$12$fopnIP54uAfhkg.x71wyQOzifTWSAXdj0BIuw/sF/RqPZGEB6qMjC',
    '$2b$12$y/MvTKh0eRHO4iVnFYSg8ekBq0Nr2vxZlCbu1PYIgaaW1JQ3tsEbm',
    '$2b$12$2n.SxVi1Sr3/BcyzdQT22.cNDNPLzf6yOcnZz0Nt0npaFyGYkn3cS'
  ];

  for (const h of otherHashes) {
    const valid = await bcrypt.compare('testpass123', h);
    console.log(`  ${h.substring(0, 30)}... : ${valid ? '✅' : '❌'}`);
  }
}

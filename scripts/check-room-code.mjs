// 房间码必须是 100–999 的 3 位数字
function generateRoomCode() {
  return String(100 + Math.floor(Math.random() * 900));
}

let failed = 0;
for (let i = 0; i < 2000; i++) {
  const code = generateRoomCode();
  const ok = /^\d{3}$/.test(code) && Number(code) >= 100 && Number(code) <= 999;
  if (!ok) {
    console.log(`FAIL got=${code}`);
    failed++;
  }
}

const sample = generateRoomCode();
console.log(`sample=${sample} length=${sample.length}`);
if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log('all passed');

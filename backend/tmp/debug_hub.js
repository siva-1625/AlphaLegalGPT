import * as hub from '@huggingface/hub';
console.log('Hub exports:', Object.keys(hub));
try {
  const api = new hub.HfApi();
  console.log('HfApi created successfully');
} catch (e) {
  console.log('HfApi error:', e.message);
}

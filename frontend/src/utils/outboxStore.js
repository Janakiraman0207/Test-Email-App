const OUTBOX_KEY = 'stackly_outbox';

export const getOutboxItems = () => {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  } catch {
    return [];
  }
};

export const addToOutbox = (emailData) => {
  const items = getOutboxItems();
  const newItem = {
    ...emailData,
    id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    outbox_status: 'failed',
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    subject: emailData.subject || '(No Subject)',
    to: emailData.to || '',
    body: emailData.body || '',
  };
  items.unshift(newItem);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  return newItem;
};

export const removeFromOutbox = (id) => {
  const items = getOutboxItems().filter((item) => item.id !== id);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
};

export const updateOutboxItemStatus = (id, status) => {
  const items = getOutboxItems().map((item) =>
    item.id === id ? { ...item, outbox_status: status } : item
  );
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
};

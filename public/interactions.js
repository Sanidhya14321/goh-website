for (const block of document.querySelectorAll('[data-command]')) {
  const copy = block.querySelector('button');
  const code = block.querySelector('code');
  const status = block.querySelector('[role="status"]');
  if (!copy || !code || !status || !navigator.clipboard?.writeText) continue;

  copy.hidden = false;
  let reset;
  copy.addEventListener('click', async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
      status.textContent = 'Command copied.';
    } catch {
      copy.textContent = 'Copy';
      status.textContent = 'Copy blocked. Select the command to copy it.';
    }
    reset = setTimeout(() => {
      copy.textContent = 'Copy';
      status.textContent = '';
    }, 2600);
  });
}

for (const group of document.querySelectorAll('[data-model-filter]')) {
  const control = group.querySelector('select');
  const status = group.querySelector('[role="status"]');
  const section = group.closest('section');
  if (!control || !status || !section) continue;

  const records = [...section.querySelectorAll('[data-benchmark-model]')];
  const rows = records.filter((record) => record.tagName === 'TR');
  const update = () => {
    for (const record of records) {
      record.hidden = control.value !== '' && record.dataset.benchmarkModel !== control.value;
    }
    const count = rows.filter((row) => !row.hidden).length;
    status.textContent = `${count} of ${rows.length} runs shown`;
  };
  control.addEventListener('change', update);
  update();
  group.hidden = false;
}

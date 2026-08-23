// Copy buttons on enhanced code blocks (ported from CodeBlock.tsx behaviour).
function initCopyButtons() {
	document.querySelectorAll<HTMLButtonElement>('.code-copy-btn').forEach((btn) => {
		if (btn.dataset.wired === 'true') return;
		btn.dataset.wired = 'true';

		btn.addEventListener('click', () => {
			const pre = btn.closest('.code-block')?.querySelector('pre');
			const code = pre?.textContent ?? '';
			navigator.clipboard.writeText(code).then(() => {
				btn.classList.add('copied');
				const label = btn.querySelector('span:not([class])');
				if (label) label.textContent = 'Copied';
				setTimeout(() => {
					btn.classList.remove('copied');
					if (label) label.textContent = 'Copy';
				}, 2000);
			});
		});
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initCopyButtons);
} else {
	initCopyButtons();
}

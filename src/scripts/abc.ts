import abcjs from 'abcjs';

// Hydrate all ```abc placeholders rendered by remark-abc.
function mountAbcBlocks() {
	document.querySelectorAll<HTMLElement>('.abc-body[data-abc]').forEach((el) => {
		if (el.dataset.mounted === 'true') return;
		el.dataset.mounted = 'true';
		try {
			abcjs.renderAbc(el, el.dataset.abc!, { responsive: 'resize' });
		} catch (err) {
			console.error('Failed to render ABC notation:', err);
			const fallback = document.createElement('p');
			fallback.className = 'abc-invalid';
			fallback.textContent = 'Failed to render ABC notation.';
			el.replaceChildren(fallback);
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountAbcBlocks);
} else {
	mountAbcBlocks();
}

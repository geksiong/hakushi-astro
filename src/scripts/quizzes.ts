function initQuizzes() {
	document.querySelectorAll<HTMLElement>('.quiz-card').forEach((quiz) => {
		if (quiz.dataset.wired) return;
		quiz.dataset.wired = 'true';
		const options = [...quiz.querySelectorAll<HTMLButtonElement>('.quiz-option')];
		const feedback = quiz.querySelector<HTMLElement>('.quiz-feedback');
		const retry = quiz.querySelector<HTMLButtonElement>('.quiz-retry');
		if (!feedback || !retry) return;
		for (const option of options) {
			option.addEventListener('click', () => {
				const correct = option.dataset.correct === 'true';
				for (const button of options) {
					button.disabled = true;
					if (button.dataset.correct === 'true') button.classList.add('is-correct');
				}
				if (!correct) option.classList.add('is-wrong');
				feedback.textContent = correct ? 'Correct!' : 'Not quite. The correct answer is highlighted.';
				feedback.hidden = false;
				retry.hidden = correct;
			});
		}
		retry.addEventListener('click', () => {
			for (const button of options) {
				button.disabled = false;
				button.classList.remove('is-correct', 'is-wrong');
			}
			feedback.hidden = true;
			retry.hidden = true;
		});
	});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initQuizzes);
else initQuizzes();

class ProjectInput {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLFormElement;

	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		this.templateElement = document.getElementById(
			'project-input'
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLFormElement;
		this.element.id = 'user-input';

		this.titleInputElement = this.element.querySelector(
			'#title'
		) as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector(
			'#description'
		) as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector(
			'#people'
		) as HTMLInputElement;
		this.configure();
		this.attach();
	}

	private gatherUserInput(): [string, string, number] | void {
		const title = this.titleInputElement.value;
		const description = this.descriptionInputElement.value;
		const people = this.peopleInputElement.value;

		if (
			title.trim().length === 0 ||
			description.trim().length === 0 ||
			people.trim().length === 0
		) {
			alert('올바르지않은 입력값입니다. 다시 한번 확인해주세요');
			return;
		} else {
			return [title, description, +people];
		}
	}

	private clearInputs() {
		this.titleInputElement.value = '';
		this.descriptionInputElement.value = '';
		this.peopleInputElement.value = '';
	}

	// 화살표함수는 this 바인딩을 하지 않기 때문에 원래 가리키게 될 대상(formElement)의 상위인 ProjectInput Class를 가리키게 된다.
	private submitHandler = (event: Event) => {
		event.preventDefault();
		console.log('submit', this);
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			console.log(userInput);
			this.clearInputs();
		}
	};

	// 실행이 메서드로서가 아닌 메서드의 내부함수로써 실행이기 때문에 this가 메서드를 실행시킨 대상(this.element == FormElement)을 가리키게 된다.
	// private submitHandler(event: Event) {
	// 	event.preventDefault();
	// 	console.log('submit', this);
	// 	console.log(this.titleInputElement.value); // error
	// }

	private configure() {
		console.log('config', this);
		// this.submitHandler에서의 this가 this.element인 formElement와 같다.
		// 즉, submitHandler는 formElement에 의해서 실행이 되었음
		this.element.addEventListener('submit', this.submitHandler);
	}

	private attach() {
		this.hostElement.insertAdjacentElement('afterbegin', this.element);
	}
}

const prjInput = new ProjectInput();

// Project State Management
type Project = {
	id: string;
	title: string;
	description: string;
	people: number;
};

class ProjectState {
	private listeners: Function[] = [];
	private projects: Project[] = [];
	private static instance: ProjectState;

	private constructor() {}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addListener(listenerFn: Function) {
		this.listeners.push(listenerFn);
	}

	addProject(title: string, description: string, people: number) {
		const newProject = {
			id: Math.random().toString(),
			title,
			description,
			people,
		};
		this.projects.push(newProject);
		for (const listenerFn of this.listeners) {
			listenerFn([...this.projects]);
		}
	}
}

const projectState = ProjectState.getInstance();

// Vaildate
type Validatable = {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
};

function validate(validatableInput: Validatable) {
	let isValid = true;
	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().trim().length !== 0;
	}
	if (
		validatableInput.minLength != undefined &&
		typeof validatableInput.value === 'string'
	) {
		isValid =
			isValid && validatableInput.value.length > validatableInput.minLength;
	}
	if (
		validatableInput.maxLength != undefined &&
		typeof validatableInput.value === 'string'
	) {
		isValid =
			isValid && validatableInput.value.length < validatableInput.maxLength;
	}
	if (
		validatableInput.min != undefined &&
		typeof validatableInput.value === 'number'
	) {
		isValid = isValid && validatableInput.value > validatableInput.min;
	}
	if (
		validatableInput.max != undefined &&
		typeof validatableInput.value === 'number'
	) {
		isValid = isValid && validatableInput.value < validatableInput.max;
	}
	return isValid;
}

// ProjectList Class
class ProjectList {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLElement;
	assignedProjects: Project[];

	constructor(private type: 'active' | 'finished') {
		this.templateElement = document.getElementById(
			'project-list'
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;
		this.assignedProjects = [];

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLElement;
		this.element.id = `${this.type}-projects`;

		projectState.addListener((projects: Project[]) => {
			this.assignedProjects = projects;
			this.renderProjects();
		});

		this.attach();
		this.renderContent();
	}

	private renderProjects() {
		const listId = `${this.type}-projects-list`;
		const listEl = document.getElementById(listId)!;
		for (const prjItem of this.assignedProjects) {
			const listItem = document.createElement('li');
			listItem.textContent = prjItem.title;
			listEl.appendChild(listItem);
		}
	}

	private renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent =
			this.type.toUpperCase() + ' PROJECTS';
	}

	private attach() {
		this.hostElement.insertAdjacentElement('beforeend', this.element);
	}
}

// ProjectInput Class
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
			!validate({ value: title, required: true }) ||
			!validate({ value: description, required: true, minLength: 5 }) ||
			!validate({ value: +people, required: true, min: 1, max: 5 })
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
			const [title, description, people] = userInput;
			projectState.addProject(title, description, people);
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
		// this.submitHandler에서의 this가 this.element인 formElement와 같다.
		// 즉, submitHandler는 formElement에 의해서 실행이 되었음
		this.element.addEventListener('submit', this.submitHandler);
	}

	private attach() {
		this.hostElement.insertAdjacentElement('afterbegin', this.element);
	}
}

const prjInput = new ProjectInput();
const activeList = new ProjectList('active');
const finishedList = new ProjectList('finished');

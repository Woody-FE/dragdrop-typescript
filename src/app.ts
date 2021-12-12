// Drag & Drop Type
interface Draggable {
	dragStartHandler(event: DragEvent): void;
	dragEndHandler(event: DragEvent): void;
}

type DragTarget = {
	dragOverHandler: (event: DragEvent) => void;
	dragLeaveHandler: (event: DragEvent) => void;
	dropHandler: (event: DragEvent) => void;
};

// 이넘을 통해서 스테이터스 관리
enum ProjectStatus {
	Active,
	Finished,
}

class Project {
	constructor(
		public id: string,
		public title: string,
		public description: string,
		public people: number,
		public status: ProjectStatus
	) {}
}

type Listener<T> = (items: T[]) => void;

class State<T> {
	// private는 해당 클래스 내에서만 접근 가능, protected는 상속받은 클래스 내에서도 접근 가능
	protected listeners: Listener<T>[] = [];

	addListener(listenerFn: Listener<T>) {
		this.listeners.push(listenerFn);
	}
}

class ProjectState extends State<Project> {
	private projects: Project[] = [];
	private static instance: ProjectState;

	private constructor() {
		super();
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addProject(title: string, description: string, people: number) {
		const newProject = new Project(
			Math.random().toString(),
			title,
			description,
			people,
			ProjectStatus.Active
		);
		this.projects.push(newProject);
		this.updateListener();
	}
	moveProject(projectId: string, newStatus: ProjectStatus) {
		const project = this.projects.find((prj) => prj.id === projectId);
		if (project && project.status !== newStatus) {
			project.status = newStatus;
			this.updateListener();
		}
	}

	private updateListener() {
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

// Component
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;

	constructor(
		templateId: string,
		hostElementId: string,
		insertAtStart: boolean,
		newElementId?: string
	) {
		this.templateElement = document.getElementById(
			templateId
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as U;
		if (newElementId) {
			this.element.id = newElementId;
		}

		this.attach(insertAtStart);
	}

	private attach(insertAtBeginning: boolean) {
		this.hostElement.insertAdjacentElement(
			insertAtBeginning ? 'afterbegin' : 'beforeend',
			this.element
		);
	}

	abstract configure(): void;
	abstract renderContent(): void;
}

class ProjectItem
	extends Component<HTMLUListElement, HTMLLIElement>
	implements Draggable {
	private project: Project;

	get persons() {
		if (this.project.people === 1) {
			return '1 person';
		} else {
			return `${this.project.people} persons`;
		}
	}

	constructor(hostId: string, project: Project) {
		super('single-project', hostId, false, project.id);
		this.project = project;

		this.configure();
		this.renderContent();
	}

	dragStartHandler = (event: DragEvent) => {
		console.log(this.project.id);
		event.dataTransfer!.setData('text/plain', this.project.id);
		event.dataTransfer!.effectAllowed = 'move';
	};

	dragEndHandler = (_: DragEvent) => {
		console.log('End');
	};

	configure() {
		this.element.addEventListener('dragstart', this.dragStartHandler);
		this.element.addEventListener('dragend', this.dragEndHandler);
	}

	renderContent() {
		this.element.querySelector('h2')!.textContent = this.project.title;
		this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
		this.element.querySelector('p')!.textContent = this.project.description;
	}
}

// ProjectList Class
class ProjectList
	extends Component<HTMLDivElement, HTMLElement>
	implements DragTarget {
	assignedProjects: Project[];

	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects`);
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}

	dropHandler = (event: DragEvent) => {
		const prjId = event.dataTransfer!.getData('text/plain');
		projectState.moveProject(
			prjId,
			this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
		);
	};
	dragOverHandler = (event: DragEvent) => {
		if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
			event.preventDefault();
			const listEl = this.element.querySelector('ul')!;
			listEl.classList.add('droppable');
		}
	};
	dragLeaveHandler = (_: DragEvent) => {
		const listEl = this.element.querySelector('ul')!;
		listEl.classList.remove('droppable');
	};

	configure() {
		this.element.addEventListener('dragover', this.dragOverHandler);
		this.element.addEventListener('dragleave', this.dragLeaveHandler);
		this.element.addEventListener('drop', this.dropHandler);
		projectState.addListener((projects: Project[]) => {
			// 상태에 맞도록 추가
			const relevantProjects = projects.filter((project) => {
				if (this.type === 'active') {
					return project.status === ProjectStatus.Active;
				}
				return project.status === ProjectStatus.Finished;
			});
			this.assignedProjects = relevantProjects;
			this.renderProjects();
		});
	}

	renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent =
			this.type.toUpperCase() + ' PROJECTS';
	}

	private renderProjects() {
		const listId = `${this.type}-projects-list`;
		const listEl = document.getElementById(listId)!;
		listEl.innerHTML = '';
		for (const prjItem of this.assignedProjects) {
			new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
		}
	}
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		super('project-input', 'app', true, 'user-input');

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
	}

	configure() {
		// this.submitHandler에서의 this가 this.element인 formElement와 같다.
		// 즉, submitHandler는 formElement에 의해서 실행이 되었음
		this.element.addEventListener('submit', this.submitHandler);
	}

	renderContent() {}

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
}

const prjInput = new ProjectInput();
const activeList = new ProjectList('active');
const finishedList = new ProjectList('finished');

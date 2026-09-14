type PaletteAction = {
  group: string;
  className?: string;
  title?: string;
  separator?: boolean;
  action?: {
    click?: (event: Event) => void;
    dragstart?: (event: Event) => void;
  };
};

type Palette = { registerProvider: (provider: unknown) => void };
type Create = { start: (event: Event, shape: unknown) => void };
type ElementFactory = { createShape: (attrs: Record<string, unknown>) => unknown };
type Tool = { activateHand?: (event: Event) => void; activateSelection?: (event: Event) => void; start?: (event: Event) => void };
type Translate = (value: string) => string;

export default class SimplePaletteProvider {
  static $inject = [
    'palette',
    'create',
    'elementFactory',
    'lassoTool',
    'handTool',
    'globalConnect',
    'translate',
  ];

  private _create: Create;
  private _elementFactory: ElementFactory;
  private _lassoTool: Tool;
  private _handTool: Tool;
  private _globalConnect: Tool;
  private _translate: Translate;

  constructor(
    palette: Palette,
    create: Create,
    elementFactory: ElementFactory,
    lassoTool: Tool,
    handTool: Tool,
    globalConnect: Tool,
    translate: Translate
  ) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._lassoTool = lassoTool;
    this._handTool = handTool;
    this._globalConnect = globalConnect;
    this._translate = translate;
    palette.registerProvider(this);
  }

  getPaletteEntries(): Record<string, PaletteAction> {
    const createAction = (type: string, group: string, className: string, title: string): PaletteAction => {
      const createListener = (event: Event) => {
        const shape = this._elementFactory.createShape({ type });
        this._create.start(event, shape);
      };
      return {
        group,
        className,
        title,
        action: { dragstart: createListener, click: createListener },
      };
    };

    const t = this._translate;

    return {
      'hand-tool': {
        group: 'tools',
        className: 'bpmn-icon-hand-tool',
        title: t('Move canvas'),
        action: {
          click: (event) => this._handTool.activateHand?.(event),
        },
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: t('Select'),
        action: {
          click: (event) => this._lassoTool.activateSelection?.(event),
        },
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: t('Connect'),
        action: {
          click: (event) => this._globalConnect.start?.(event),
        },
      },
      'tool-separator': {
        group: 'tools',
        separator: true,
      },
      'create.start-event': createAction(
        'bpmn:StartEvent',
        'event',
        'bpmn-icon-start-event-none',
        t('Start')
      ),
      'create.task': createAction('bpmn:Task', 'activity', 'bpmn-icon-task', t('Task')),
      'create.exclusive-gateway': createAction(
        'bpmn:ExclusiveGateway',
        'gateway',
        'bpmn-icon-gateway-xor',
        t('Decision')
      ),
      'create.parallel-gateway': createAction(
        'bpmn:ParallelGateway',
        'gateway',
        'bpmn-icon-gateway-parallel',
        t('Parallel')
      ),
      'create.end-event': createAction(
        'bpmn:EndEvent',
        'event',
        'bpmn-icon-end-event-none',
        t('End')
      ),
    };
  }
}

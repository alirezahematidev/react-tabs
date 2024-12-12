import { Children, createContext, createRef, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

const TabsChildrenContext = createContext<boolean>(false);

type TabIdentifier = string | number;

export interface TabProps {
  id: TabIdentifier;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface BaseProps {
  /**
   * @todo layout `vertical` is not implemented yet
   */
  layout?: "horizontal" | "vertical";
  direction?: "ltr" | "rtl";
  activeTabId: TabIdentifier;
  onChange: (id: TabIdentifier) => void;
}

interface PropsWithTabs {
  tabs: TabProps[];
}

interface PropsWithChildren {
  children: React.ReactElement<TabProps>[];
}

type TabsProps = Partial<BaseProps> & (PropsWithTabs | PropsWithChildren);

function Tab(props: TabProps): React.ReactNode {
  const isTabsChildren = useContext(TabsChildrenContext);

  console.assert(typeof props === "object");

  if (!isTabsChildren) throw new Error("Tab should render in Tabs component as top child.");

  return null;
}

function isChildren(props: TabsProps): props is Extract<TabsProps, PropsWithChildren> {
  return "children" in props && Array.isArray(props.children);
}

function def(tabId: TabIdentifier | undefined, tabs: TabProps[] = []) {
  const activeTab = tabs.find((tab) => tab.id === tabId) ?? tabs[0];

  if (activeTab.disabled) {
    const tab = tabs.find((tab) => !tab.disabled);

    return tab ? tab.id : null;
  }

  return activeTab.id;
}

function preparedTabs(props: TabsProps) {
  if (isChildren(props)) {
    const childProps = Children.map(props.children, ({ props }) => props);

    return childProps;
  }

  return props.tabs;
}

type TabObjectClass = { [cls: string]: boolean | undefined };

type TabClass = string | TabObjectClass;

function classes(...inputs: TabClass[]) {
  const classList: string[] = [];

  function handleClassObject(inputObject: TabObjectClass) {
    const list: string[] = [];

    for (const key in inputObject) {
      if (inputObject[key]) list.push(key);
    }

    return list;
  }

  inputs.forEach((input) => {
    if (typeof input === "string") {
      classList.push(input);
    } else {
      classList.push(...handleClassObject(input));
    }
  });

  return [...new Set(classList)].filter(Boolean).join(" ");
}

function useTabState(props: TabsProps, tabs: TabProps[]) {
  const [activeTabId, onChange] = useState<TabIdentifier | null>(def(props.activeTabId, tabs));

  return { activeTabId, onChange };
}

interface ActiveIndicatorProps {
  activeTabId: TabIdentifier | null;
  tabs: TabProps[];
  refs: React.MutableRefObject<{
    [k: string]: React.RefObject<HTMLSpanElement>;
  }>;
}

type Styles = {
  width: number;
  height: number;
  bottom: number;
  transform: string;
};

const defaultStyles: Styles = {
  transform: "translateX(0)",
  width: 0,
  bottom: 0,
  height: 0,
};

function ActiveIndicator({ activeTabId, tabs, refs }: ActiveIndicatorProps) {
  const [style, setStyle] = useState<Styles>(defaultStyles);

  const initial = useRef<boolean>(true);

  useLayoutEffect(() => {
    const enabledTabs = tabs.filter((tab) => !tab.disabled);

    const activeIndex = enabledTabs.findIndex((tab) => tab.id === activeTabId);

    if (activeIndex === -1) return;

    const current = refs.current[enabledTabs[activeIndex].id].current;

    if (current) {
      const width = current.clientWidth;
      const height = Math.min(current.clientHeight, 2);
      const bottom = (height / 2) * -1;
      const transform = `translateX(${current.offsetLeft}px)`;

      initial.current = false;

      setStyle({ width, height, bottom, transform });
    }
  }, [refs, tabs, activeTabId]);

  if (initial.current) return null;

  return <div className="tab-item-indicator" style={style} />;
}

function Tabs(props: TabsProps) {
  const tabs = useMemo(() => preparedTabs(props), [props]);

  const parent = useRef<HTMLDivElement>(null);

  const refs = useRef(Object.fromEntries(tabs.map(({ id }) => [id, createRef<HTMLSpanElement>()])));

  const { activeTabId, onChange } = useTabState(props, tabs);

  function onTabChange(event: React.MouseEvent, id: TabIdentifier, disabled?: boolean) {
    event.preventDefault();

    if (activeTabId !== id && !disabled) onChange(id);
  }

  const content = useMemo(() => {
    const tab = tabs.find((item) => item.id === activeTabId);

    if (!tab || tab.disabled) return null;

    return tab.content;
  }, [tabs, activeTabId]);

  useLayoutEffect(() => {
    if (!parent.current || !refs.current) return;

    const list: string[] = [];

    const element = parent.current;

    const _refs = Object.entries(refs.current);

    const handle = () => {
      const width = element.clientWidth;

      const actualMinWidth = _refs.reduce((prev, [_id, ref]) => {
        return prev + (ref.current?.clientWidth || 0);
      }, 0);

      if (width < actualMinWidth + (_refs.length - 1) * 8) {
        const popped = _refs.pop();

        if (popped) list.push(popped[0]);
      }
    };

    handle();
    window.addEventListener("resize", handle);

    return () => {
      window.removeEventListener("resize", handle);
    };
  }, []);

  return (
    <TabsChildrenContext.Provider value>
      <div className="tab-container" ref={parent}>
        <div className="tab-items">
          {tabs.map(({ id, label, disabled }) => {
            return (
              <span
                key={id}
                ref={refs.current[id]}
                className={classes("tab-item", { "active-tab-item": id === activeTabId, "disabled-tab-item": disabled })}
                onMouseDown={(event) => onTabChange(event, id, disabled)}
              >
                {label}
              </span>
            );
          })}
          <ActiveIndicator activeTabId={activeTabId} refs={refs} tabs={tabs} />
        </div>
        <div className="active-tab-content">{content}</div>
      </div>
    </TabsChildrenContext.Provider>
  );
}

Tabs.Tab = Tab;

export { Tabs };

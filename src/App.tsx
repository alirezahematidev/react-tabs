import { useState } from "react";
import { TabProps, Tabs } from "./tabs";

const tabs: TabProps[] = [
  {
    id: "about",
    content: <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>about content</div>,
    label: "About",
  },
  {
    id: "contact",
    content: <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>contact content</div>,
    label: "Contact me with your friends",
  },
];

function App() {
  const [id, setId] = useState<string | number>("about");

  console.log({ id });

  return (
    <div style={{ padding: 50 }}>
      <Tabs tabs={tabs} activeTabId={id} onChange={(i) => setId(i)} />
    </div>
  );
}

export default App;

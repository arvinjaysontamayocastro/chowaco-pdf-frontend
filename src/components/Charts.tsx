import React, { useState } from "react";
import classes from "./Charts.module.css";

function ChartsComponent({ extractedReport }: any) {
  const [activeTab, setActiveTab] = useState("tab1");

  return (
    <div className={classes.container}>
      <div className={classes.tabbuttons}>
        <button
          onClick={() => setActiveTab("tab1")}
          className={activeTab === "tab1" ? classes.active : ""}
        >
          Tab 1
        </button>
        <button
          onClick={() => setActiveTab("tab2")}
          className={activeTab === "tab2" ? classes.active : ""}
        >
          Tab 2
        </button>
      </div>

      <div className={classes.tabcontent}>
        {activeTab === "tab1" && <div>Content for Tab 1</div>}
        {activeTab === "tab2" && <div>Content for Tab 2</div>}
      </div>
    </div>
  );
}

export default ChartsComponent;

// GoalActiveButton.js
import React, { useState } from "react";
import supabase from "../assets/supabase/client"; // Asegúrate de importar supabase

const GoalActiveButton = ({ goalId, initialActiveState }) => {
  const [active, setActive] = useState(initialActiveState);

  const toggleActive = async () => {
    const newActiveState = active === 1 ? 0 : 1;

    // Actualización en la base de datos usando supabase
    const { data, error } = await supabase
      .from("goals")
      .update({ active: newActiveState })
      .eq("id", goalId)
      .select();

    if (error) {
      console.error("Error updating active state:", error);
    } else {
      // Actualizar el estado local después de la actualización en la base de datos
      setActive(newActiveState);
    }
  };

  return (
    <button
      onClick={toggleActive}
      style={{
        backgroundColor: active ? "green" : "red",
        color: "white",
        padding: "5px 10px",
        border: "none",
        borderRadius: "5px",
      }}
    >
      {active ? "Active" : "Paused"}
    </button>
  );
};

export default GoalActiveButton;

import React, { useState, useEffect, useContext } from "react";
import supabase from "../assets/supabase/client";
import { AuthContext } from "../contexts/userAuth";
import Modal from "react-modal"; // Importamos la librería para el modal

const GoalsCrud = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(1);
  const [microcycle, setMicrocycle] = useState(1);
  const [microcycles, setMicrocycles] = useState([]);
  const [lastMicrocycle, setLastMicrocycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editedGoal, setEditedGoal] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false); // Estado para controlar la visibilidad del modal

  useEffect(() => {
    const fetchMicrocycles = async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("microcycle")
        .eq("user_id", user.id)
        .order("microcycle", { ascending: false })
        .limit(1);
  
      if (error) {
        console.error("Error fetching microcycles:", error);
      } else {
        const maxMicrocycle = data.length > 0 ? data[0].microcycle : 1;
        setMicrocycles(Array.from({ length: maxMicrocycle }, (_, i) => i + 1));
        setMicrocycle(maxMicrocycle); // Seleccionar el microciclo más alto por defecto
        fetchLastMicrocycle(maxMicrocycle);
      }
    };
  
    const fetchLastMicrocycle = async (maxMicrocycle) => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("microcycle", maxMicrocycle);
  
      if (error) {
        console.error("Error fetching last microcycle data:", error);
      } else {
        setLastMicrocycle(data);
      }
    };
  
    const fetchGoals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("microcycle", microcycle);
  
      if (error) {
        console.error("Error fetching goals:", error);
      } else {
        setGoals(data);
      }
      setLoading(false);
    };
  
    if (user) {
      fetchMicrocycles();
      fetchGoals();
    }
  }, [user, microcycle]);

  const createGoal = async () => {
    if (!exercise) return alert("Exercise field cannot be empty.");

    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          Exercise: exercise,
          Sets: sets || 1,
          Reps: reps || 1,
          user_id: user.id,
          microcycle: microcycle,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating goal:", error);
    } else {
      setGoals([...goals, data[0]]);
      setExercise("");
      setSets(1);
      setReps(1);
    }
  };

  const handleEditChange = (e, field, goalId) => {
    setEditedGoal((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const saveEditedGoal = async (goalId) => {
    const { data, error } = await supabase
      .from("goals")
      .update(editedGoal)
      .eq("id", goalId)
      .select();
  
    if (error) {
      console.error("Error saving edited goal:", error);
    } else if (data && data.length > 0) {
      setGoals(goals.map((goal) => (goal.id === goalId ? data[0] : goal)));
      setEditingGoalId(null);
      setEditedGoal({});
    } else {
      console.error("No data returned when updating the goal.");
    }
  };

  const handleEdit = (goal) => {
    setEditingGoalId(goal.id);
    setEditedGoal({
      Exercise: goal.Exercise,
      Sets: goal.Sets,
      Reps: goal.Reps,
    });
  };

  const createNextMicrocycle = async () => {
    if (!lastMicrocycle || lastMicrocycle.length === 0) return;

    const newMicrocycle = microcycle + 1;

    const { data: lastGoals, error: fetchError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", microcycle)
      .order("id", { ascending: true });

    if (fetchError) {
      console.error("Error fetching last microcycle goals:", fetchError);
      return;
    }

    if (!lastGoals || lastGoals.length === 0) {
      console.error("No goals found for the current microcycle.");
      return;
    }

    const newGoals = lastGoals.map((goal) => {
      const { id, ...goalWithoutId } = goal;
      return {
        ...goalWithoutId,
        microcycle: newMicrocycle,
      };
    });

    const { data, error } = await supabase
      .from("goals")
      .insert(newGoals)
      .select();

    if (error) {
      console.error("Error creating next microcycle:", error);
    } else {
      setGoals((prevGoals) => [...prevGoals, ...data]);
      setMicrocycle(newMicrocycle);
    }
  };

  const toggleActive = async (id, currentActiveState) => {
    const newActiveState = currentActiveState === 1 ? 0 : 1;

    const { data, error } = await supabase
      .from("goals")
      .update({ active: newActiveState })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating active state:", error);
    } else {
      setGoals(goals.map((goal) => (goal.id === id ? { ...goal, active: newActiveState } : goal)));
    }
  };

  return (
    <div>

      <button onClick={() => setModalIsOpen(true)}>Open Goals Modal</button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Goals Modal"
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.75)" },
          content: {
            backgroundColor: "white",
            padding: "20px",
            maxWidth: "600px",
            margin: "auto",
            borderRadius: "8px",
          },
        }}
      >
        <h2>Add New Goal</h2>
        <label>
          Select Microcycle:
          <select value={microcycle} onChange={(e) => setMicrocycle(parseInt(e.target.value))}>
            {microcycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                Microcycle {cycle}
              </option>
            ))}
          </select>
        </label>
        <p>Exercise:</p>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        />
        <p>Sets:</p>
        <input
          type="number"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(parseInt(e.target.value) || 1)}
          id="sets-input"
        />
        <p>Reps:</p>
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 1)}
          id="reps-input"
        />
        <button onClick={createGoal}>Add Goal</button>

        <button onClick={createNextMicrocycle}>Create Next Microcycle</button>

        <h2>Your Goals</h2>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals && goals.length > 0 ? (
          <table border="1" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Actions</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id}>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="text"
                        value={editedGoal.Exercise || goal.Exercise}
                        onChange={(e) => handleEditChange(e, "Exercise", goal.id)}
                      />
                    ) : (
                      goal.Exercise
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="number"
                        value={editedGoal.Sets || goal.Sets}
                        onChange={(e) => handleEditChange(e, "Sets", goal.id)}
                      />
                    ) : (
                      goal.Sets
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <input
                        type="number"
                        value={editedGoal.Reps || goal.Reps}
                        onChange={(e) => handleEditChange(e, "Reps", goal.id)}
                      />
                    ) : (
                      goal.Reps
                    )}
                  </td>
                  <td>
                    {editingGoalId === goal.id ? (
                      <button onClick={() => saveEditedGoal(goal.id)}>Save</button>
                    ) : (
                      <button onClick={() => handleEdit(goal)}>Edit</button>
                    )}
                    <button onClick={() => deleteGoal(goal.id)}>Delete</button>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(goal.id, goal.active)}
                      style={{
                        backgroundColor: goal.active ? "green" : "red",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "5px",
                      }}
                    >
                      {goal.active ? "Active" : "Paused"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No goals found for this microcycle.</p>
        )}
      </Modal>
    </div>
  );
};

export default GoalsCrud;

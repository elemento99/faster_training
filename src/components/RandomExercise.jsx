import React, { useState, useEffect, useContext } from "react";
import supabase from "../assets/supabase/client";
import { AuthContext } from "../contexts/userAuth";
import { Button, Form, Container, Row, Col, Card } from "react-bootstrap";

const DoneExercise = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [reps, setReps] = useState(0);
  const [fail, setFail] = useState(false);

  const fetchGoals = async () => {
  
    const { data: maxData, error: maxError } = await supabase
      .from("goals")
      .select("microcycle")
      .order("microcycle", { ascending: false })
      .limit(1);

    if (maxError) {
      console.error("Error fetching max microcycle:", maxError);
      return;
    }

    const maxMicrocycle = maxData[0]?.microcycle;

    if (!maxMicrocycle) {
      console.warn("No microcycle data found");
      return;
    }


    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("microcycle", maxMicrocycle)
      .eq("active", 1);

    if (error) {
      console.error("Error fetching goals:", error);
    } else {
      setGoals(data);
      if (data.length > 0) {
        selectRandomGoal(data);
      } else {
        setSelectedGoal(null);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const selectRandomGoal = (activeGoals) => {
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
    setSelectedGoal(randomGoal);
    setReps(randomGoal.Reps);
  };

  const handleDone = async () => {
    if (!selectedGoal) return;

    const { error } = await supabase
      .from("done")
      .insert([
        {
          goals_id: selectedGoal.id,
          reps: reps,
          fail: fail,
          goals_microcycle: selectedGoal.microcycle,
          user_id: user.id,
        },
      ]);

    if (error) {
      console.error("Error saving done exercise:", error);
    } else {
      alert("Exercise marked as done!");
      setReps(selectedGoal.Reps);
      setFail(false);
      selectRandomGoal(goals);
    }
  };

  const handleNext = () => {
    if (goals.length > 0) {
      selectRandomGoal(goals);
    }
  };

  const handlePause = async () => {
    if (!selectedGoal) return;

    const { error } = await supabase
      .from("goals")
      .update({ active: 0 })
      .eq("id", selectedGoal.id);

    if (error) {
      console.error("Error pausing goal:", error);
    } else {
      alert("Goal paused!");
      await fetchGoals()
    }
  };

  return (
    <Container className="mt-4">
      {selectedGoal ? (
        <Card>
          <Card.Body>
            <Card.Title>Exercise: {selectedGoal.Exercise}</Card.Title>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <Form.Label>Reps:</Form.Label>
                <Form.Control
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                  id="reps-input"
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} md={6}>
                <Form.Check
                  type="checkbox"
                  label="Fail"
                  checked={fail}
                  onChange={() => setFail(!fail)}
                />
              </Col>
            </Row>
            <Row className="d-flex justify-content-between">
              <Col xs={4}>
                <Button variant="primary" block onClick={handleDone}>Done</Button>
              </Col>
              <Col xs={4}>
                <Button variant="secondary" block onClick={handleNext}>Next</Button>
              </Col>
              <Col xs={4}>
                <Button variant="danger" block onClick={handlePause}>Pause</Button>
              </Col>
            </Row>

          </Card.Body>
        </Card>
      ) : (
        <p>No active goals available. Please check your goals list.</p>
      )}
    </Container>
  );
};

export default DoneExercise;

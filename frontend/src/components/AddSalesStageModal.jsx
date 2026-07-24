import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { createSalesStage } from "../services/salesStageService";

export default function AddSalesStageModal({
    show,
    onClose,
    onCreated
}) {

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {

        e.preventDefault();

        if (!name.trim()) {
            alert("Please enter a sales stage.");
            return;
        }

        setLoading(true);

        try {

            const stage = await createSalesStage({
                name: name.trim()
            });

            setName("");

            onCreated(stage);

            onClose();

        } catch (error) {

            console.error(error);

            const message =
                error.response?.data?.message ||
                "Unable to create sales stage.";

            alert(message);

        } finally {

            setLoading(false);

        }

    }

    function handleClose() {

        setName("");

        onClose();

    }

    return (

        <Modal
            show={show}
            onHide={handleClose}
            centered
        >

            <Form onSubmit={handleSubmit}>

                <Modal.Header closeButton>

                    <Modal.Title>

                        Create Sales Stage

                    </Modal.Title>

                </Modal.Header>

                <Modal.Body>

                    <Form.Group>

                        <Form.Label>

                            Sales Stage Name

                        </Form.Label>

                        <Form.Control
                            type="text"
                            placeholder="Enter sales stage"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />

                    </Form.Group>

                </Modal.Body>

                <Modal.Footer>

                    <Button
                        variant="secondary"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create"}
                    </Button>

                </Modal.Footer>

            </Form>

        </Modal>

    );

}
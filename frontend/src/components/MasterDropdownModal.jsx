import { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function MasterDropdownModal({
    show,
    onClose,
    onCreated,
    title,
    create
}) {

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (show) {
            setName("");
        }
    }, [show]);

    async function handleSave() {

        if (!name.trim()) {
            alert(`${title} name is required.`);
            return;
        }

        try {

            setSaving(true);

            const created = await create({
                name: name.trim()
            });

            onCreated(created);

            onClose();

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                `Unable to create ${title}.`
            );

        } finally {

            setSaving(false);

        }

    }

    return (

        <Modal
            show={show}
            onHide={onClose}
            centered
        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Add New {title}

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form.Group>

                    <Form.Label>

                        {title} Name

                    </Form.Label>

                    <Form.Control
                        autoFocus
                        value={name}
                        onChange={(e)=>setName(e.target.value)}
                        placeholder={`Enter ${title} name`}
                    />

                </Form.Group>

            </Modal.Body>

            <Modal.Footer>

                <Button
                    variant="secondary"
                    onClick={onClose}
                >

                    Cancel

                </Button>

                <Button
                    variant="primary"
                    disabled={saving}
                    onClick={handleSave}
                >

                    {saving
                        ? "Saving..."
                        : `Save ${title}`}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}
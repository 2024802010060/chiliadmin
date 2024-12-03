import React, { useState } from "react";
import { List, IconButton, Colors } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseconfig';

function Service({ id, title, price }) {
    const [completed, setCompleted] = useState(false);

    async function toggleComplete() {
        const serviceDoc = doc(firestore, 'Services', id);
        await updateDoc(serviceDoc, {
            completed: !completed
        });
        setCompleted(!completed);
    }

    return (
        <List.Item
            title={title}
            description={`Price: ${price}`}
            right={() => (
                <IconButton
                    icon={completed ? 'check' : 'checkbox-blank-outline'}
                    color={completed ? Colors.green500 : Colors.grey500}
                    onPress={() => toggleComplete()}
                />
            )}
        />
    )
}

export default Service;

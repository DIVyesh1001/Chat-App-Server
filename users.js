const users = [];

// Add a new user
const addUser = ({ id, name, room }) => {
    // Normalize input (case-insensitive & trimmed)
    name = name?.trim().toLowerCase();
    room = room?.trim().toLowerCase();

    if (!name || !room) {
        return { error: 'Name and room are required.' };
    }

    // Check for existing user in the same room
    const existingUser = users.find((user) => user.room === room && user.name === name);

    if (existingUser) {
        return { error: 'Username is taken in this room.' };
    }

    const user = { id, name, room };
    users.push(user);

    return { user };
};

// Remove a user by socket id
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0]; // Return removed user
    }

    return null;
};

// Get user by socket id
const getUser = (id) => users.find((user) => user.id === id);

// Get all users in a room
const getUserInRoom = (room) => {
    return users.filter((user) => user.room === room?.trim().toLowerCase());
};

module.exports = { addUser, removeUser, getUser, getUserInRoom };

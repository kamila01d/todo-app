import {useContext, useEffect, useState} from "react";
import UserContext from "./UserContext";
import axios from "axios";

function Home() {

    const userInfo = useContext(UserContext);
    const [inputVal, setInputVal] = useState('');
    const [todos,setTodos] = useState([]);
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Medium'); // Default priority is Medium



    useEffect(() => {
        axios.get('http://localhost:4000/todos', {withCredentials:true})
            .then(response => {
                setTodos(response.data);
            })
    }, []);

    if (!userInfo.email) {
        return 'Your need to be logged in to see this page';
    }

    function addTodo(e) {
        e.preventDefault();
        axios.put('http://localhost:4000/todos', {
            text:inputVal,
            dueDate: dueDate,  // Send dueDate
            priority: priority
        }, {withCredentials:true})
            .then(response => {
                setTodos([...todos, response.data]);
                setInputVal('');
                setDueDate('');  // Reset dueDate
                setPriority('Medium');
            })

    }

    function updateTodo(todo) {
        const data = {id:todo._id,done:!todo.done};
        axios.post('http://localhost:4000/todos', data, {withCredentials:true})
            .then(() => {
                const newTodos = todos.map(t => {
                    if (t._id === todo._id) {
                        t.done = !t.done;
                    }
                    return t;
                });
                setTodos([...newTodos]);
            });
    }


    return <div>
        <form onSubmit={e => addTodo(e)}>
            <input placeholder={'What do you want to do?'}
                   value={inputVal}
                   onChange={e => setInputVal(e.target.value)}/>
            <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
            />
            <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
            >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
            <button type="submit">Add Todo</button>
        </form>
        <ul>
            {todos.map(todo => {
                const isPastDue = new Date(todo.dueDate) < new Date() && !todo.done;
                return (
                    <li key={todo._id} className={isPastDue ? 'past-due' : ''}>
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={todo.done}
                            onChange={() => updateTodo(todo)}
                        />
                        {todo.done ? <del className="todo-text">{todo.text}</del> : <span className="todo-text">{todo.text}</span>}
                        {isPastDue && <span className="exclamation-mark"> ! </span>}
                        <span className="priority-text"> - {todo.priority} Priority</span>
                        <span className="due-date-text"> - Due: {new Date(todo.dueDate).toLocaleDateString()}</span>

                    </li>
                );
            })}
        </ul>
    </div>
}

export default Home;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaTools, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';

const EditItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [item, setItem] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [condition, setCondition] = useState('Good');
    const [reservedUntil, setReservedUntil] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        const loadItem = () => {
            const rawItems = localStorage.getItem('browseItems');
            
            if (!rawItems) {
                setError('No items found in local storage.');
                setLoading(false);
                return;
            }

            const allItems = JSON.parse(rawItems);
            const foundItem = allItems.find(i => i.id === id); 

            if (foundItem) {
                setItem(foundItem);
                setTitle(foundItem.title || '');
                setDescription(foundItem.description || '');
                setCondition(foundItem.condition || 'Good');
                setReservedUntil(formatDate(foundItem.reservedUntil));
                setLoading(false);
            } else {
                setError(`Item with ID: ${id} not found.`);
                setLoading(false);
            }
        };

        loadItem();
    }, [id]);

    const handleSave = (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!title.trim() || !description.trim()) {
            setError('Title and description cannot be empty.');
            return;
        }

        const updatedItem = {
            ...item,
            title,
            description,
            condition,
            reservedUntil: reservedUntil ? new Date(reservedUntil).toISOString() : null,
            owner: { name: "You" },
        };

        try {
            const rawItems = localStorage.getItem('browseItems');
            let allItems = JSON.parse(rawItems || '[]');

            const itemIndex = allItems.findIndex(i => i.id === id);

            if (itemIndex > -1) {
                allItems[itemIndex] = updatedItem; 
                
                localStorage.setItem('browseItems', JSON.stringify(allItems));
                
                setMessage('Item updated successfully!');
                setTimeout(() => navigate('/browse'), 1500); 
                
            } else {
                setError('Item not found in the list for updating.');
            }

        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save item. Check console for details.');
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading item data...</div>;
    }
    
    if (error && !item) {
        return (
            <div className="p-6 text-center text-red-600">
                <p>{error}</p>
                <button onClick={() => navigate('/browse')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
            <button 
                onClick={() => navigate('/browse')} 
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Back to Explore
            </button>
            
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Edit Item: {item.title}</h1>
            
            {message && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg">✅ {message}</div>}
            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">❌ {error}</div>}

            <form onSubmit={handleSave} className="space-y-6">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                        <FaFileAlt className="mr-2 text-indigo-500" /> Item Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter item title"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                        <FaFileAlt className="mr-2 text-indigo-500" /> Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        rows={4}
                        placeholder="Describe your item"
                        required
                    />
                </div>
                
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <FaTools className="mr-2 text-indigo-500" /> Condition
                        </label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <FaCalendarAlt className="mr-2 text-indigo-500" /> Reserved Until (Optional)
                        </label>
                        <input
                            type="date"
                            value={reservedUntil}
                            onChange={(e) => setReservedUntil(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center justify-center gap-2"
                >
                    <FaSave className="mr-2" /> Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditItem;

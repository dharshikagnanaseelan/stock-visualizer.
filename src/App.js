import React from 'react';
import Stockvisualizer from './stockvisualizer';  // Import the new component

function App() {
    return (
        <div className="App">
            <h1>Stock Visualizer</h1>
            <Stockvisualizer />  {/* Add the StockVisualizer component */}
        </div>
    );
}

export default App;


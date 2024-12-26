import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const StockVisualizer = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [symbol, setSymbol] = useState('MSFT'); // Default stock symbol
    const [inputSymbol, setInputSymbol] = useState('MSFT'); // Symbol selected from dropdown

    // List of stock symbols for the dropdown
    const stockSymbols = [
        'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'TSLA', 'NFLX',
        'META', 'NVDA', 'IBM', 'AMD', 'SPY', 'DIS', 'V', 'BA'
    ];

    // Cache expiration time in seconds (1 day)
    const CACHE_EXPIRY_TIME = 86400;

    useEffect(() => {
        const fetchStockData = async () => {
            const apiKey = 'LZSE2872H4J10JYE'; // Replace with your Alpha Vantage API key
            const now = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(now.getMonth() - 1);
            const fromDate = Math.floor(lastMonth.getTime() / 1000); // One month ago (Unix timestamp)
            const toDate = Math.floor(now.getTime() / 1000); // Current timestamp

            const cacheKey = `stockData-${symbol}-${fromDate}-${toDate}`; // Cache key to store data
            const cacheTimestampKey = `${cacheKey}-timestamp`; // Key for cache timestamp

            // Check if data is in localStorage and if it's still valid (not expired)
            const cachedData = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

            if (cachedData && cachedTimestamp && (toDate - cachedTimestamp < CACHE_EXPIRY_TIME)) {
                // If the data is valid and not expired, use the cached data
                setStockData(JSON.parse(cachedData));
                setLoading(false);
                return;
            }

            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
            const controller = new AbortController(); // To manage cleanup of fetch
            try {
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) throw new Error('Failed to fetch data from Alpha Vantage');
                const data = await response.json();

                if (data['Time Series (Daily)']) {
                    const timeSeries = data['Time Series (Daily)'];
                    const formattedData = Object.keys(timeSeries).map(date => ({
                        date,
                        open: parseFloat(timeSeries[date]['1. open']),
                        high: parseFloat(timeSeries[date]['2. high']),
                        low: parseFloat(timeSeries[date]['3. low']),
                        close: parseFloat(timeSeries[date]['4. close']),
                        volume: parseInt(timeSeries[date]['5. volume'], 10),
                    }));

                    setStockData(formattedData);

                    // Store fresh data and update the timestamp in localStorage
                    localStorage.setItem(cacheKey, JSON.stringify(formattedData));
                    localStorage.setItem(cacheTimestampKey, toDate.toString());
                    setError(null);
                } else {
                    throw new Error('No valid data returned from the API');
                }
            } catch (err) {
                console.error('Error fetching data:', err.message);
                setError(err.message || 'An unknown error occurred while fetching data.');
            } finally {
                setLoading(false);
            }

            return () => controller.abort(); // Cleanup on component unmount
        };

        fetchStockData();
    }, [symbol]); // Dependency on symbol so the effect runs when the symbol changes

    const handleSymbolChange = (e) => {
        const selectedSymbol = e.target.value;
        setInputSymbol(selectedSymbol); // Update the dropdown value
        setSymbol(selectedSymbol); // Set the symbol to fetch new data
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Stock Data Visualization</h2>

            {/* Dropdown for stock symbol selection */}
            <div style={{ marginBottom: '20px' }}>
                <select value={inputSymbol} onChange={handleSymbolChange}>
                    {stockSymbols.map((stockSymbol) => (
                        <option key={stockSymbol} value={stockSymbol}>
                            {stockSymbol}
                        </option>
                    ))}
                </select>
            </div>

            <h3>{symbol} Stock Data</h3>

            {/* Line Chart for stock data */}
            <ResponsiveContainer width="80%" height={400}>
                <LineChart data={stockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="open" stroke="#8884d8" />
                    <Line type="monotone" dataKey="high" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="low" stroke="#ff7300" />
                    <Line type="monotone" dataKey="close" stroke="#ff0000" />
                </LineChart>
            </ResponsiveContainer>

            <h3>Volume</h3>
            {/* Bar Chart for volume */}
            <ResponsiveContainer width="80%" height={200}>
                <BarChart data={stockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockVisualizer;

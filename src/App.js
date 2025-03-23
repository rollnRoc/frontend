import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [columns, setColumns] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [modelType, setModelType] = useState('cnn');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // CNN model parameters
  const [sequenceLength, setSequenceLength] = useState(10);
  const [numFilters, setNumFilters] = useState(64);
  const [kernelSize, setKernelSize] = useState(3);
  const [denseUnits, setDenseUnits] = useState(64);
  const [epochs, setEpochs] = useState(50);
  
  // LSTM model parameters
  const [lstmUnits, setLstmUnits] = useState(50);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      setFilename(data.filename);
      setColumns(data.columns);
      setTargetColumn(data.columns[0]);
      
      // Get data preview
      const previewResponse = await fetch(`http://localhost:5000/api/preview/${data.filename}`);
      if (!previewResponse.ok) {
        throw new Error('Failed to get data preview');
      }
      const previewData = await previewResponse.json();
      setPreviewData(previewData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelTrain = async () => {
    if (!filename || !targetColumn) {
      setError('Please upload a file and select a target column first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const modelParams = {
        filename,
        targetColumn,
        modelType,
        params: {
          sequenceLength: parseInt(sequenceLength),
          epochs: parseInt(epochs),
          denseUnits: parseInt(denseUnits),
          // CNN specific params
          numFilters: parseInt(numFilters),
          kernelSize: parseInt(kernelSize),
          // LSTM specific params
          lstmUnits: parseInt(lstmUnits),
        }
      };

      const response = await fetch('http://localhost:5000/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Model training failed');
      }

      const results = await response.json();
      setResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Time Series Prediction App</h1>
      </header>
      <main className="App-main">
        <div className="card">
          <h2>1. Upload Data</h2>
          <div className="file-upload">
            <input type="file" onChange={handleFileChange} accept=".csv" />
            <button onClick={handleUpload} disabled={!file || isLoading}>
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          
          {previewData && (
            <div className="data-preview">
              <h3>Data Preview:</h3>
              <p>Shape: {previewData.info.shape[0]} rows, {previewData.info.shape[1]} columns</p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {previewData.info.columns.map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.head.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {columns.length > 0 && (
          <div className="card">
            <h2>2. Configure Model</h2>
            
            <div className="form-group">
              <label>Target Column:</label>
              <select 
                value={targetColumn} 
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Model Type:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="cnn"
                    checked={modelType === 'cnn'}
                    onChange={() => setModelType('cnn')}
                  />
                  CNN
                </label>
                <label>
                  <input
                    type="radio"
                    value="lstm"
                    checked={modelType === 'lstm'}
                    onChange={() => setModelType('lstm')}
                  />
                  LSTM
                </label>
              </div>
            </div>
            
            <h3>Common Parameters</h3>
            <div className="parameter-group">
              <div className="form-group">
                <label>Sequence Length:</label>
                <input
                  type="number"
                  min="1"
                  value={sequenceLength}
                  onChange={(e) => setSequenceLength(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Dense Units:</label>
                <input
                  type="number"
                  min="1"
                  value={denseUnits}
                  onChange={(e) => setDenseUnits(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Epochs:</label>
                <input
                  type="number"
                  min="1"
                  value={epochs}
                  onChange={(e) => setEpochs(e.target.value)}
                />
              </div>
            </div>
            
            {modelType === 'cnn' && (
              <>
                <h3>CNN Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>Number of Filters:</label>
                    <input
                      type="number"
                      min="1"
                      value={numFilters}
                      onChange={(e) => setNumFilters(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Kernel Size:</label>
                    <input
                      type="number"
                      min="1"
                      value={kernelSize}
                      onChange={(e) => setKernelSize(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {modelType === 'lstm' && (
              <>
                <h3>LSTM Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>LSTM Units:</label>
                    <input
                      type="number"
                      min="1"
                      value={lstmUnits}
                      onChange={(e) => setLstmUnits(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            <button 
              className="train-button"
              onClick={handleModelTrain}
              disabled={isLoading}
            >
              {isLoading ? 'Training...' : 'Train Model'}
            </button>
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
        
        {results && (
          <div className="card results-card">
            <h2>3. Results</h2>
            <div className="metrics">
              <div className="metric">
                <h3>MSE:</h3>
                <p>{results.mse.toFixed(4)}</p>
              </div>
              <div className="metric">
                <h3>RMSE:</h3>
                <p>{results.rmse.toFixed(4)}</p>
              </div>
            </div>
            
            <h3>Prediction Plot</h3>
            <div className="plot-container">
              <img src={`data:image/png;base64,${results.plot}`} alt="Prediction Plot" />
            </div>
            
            <h3>Training History</h3>
            <div className="training-history">
              <table>
                <thead>
                  <tr>
                    <th>Epoch</th>
                    <th>Training Loss</th>
                    <th>Validation Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {results.history.loss.map((loss, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{loss.toFixed(4)}</td>
                      <td>{results.history.val_loss[index].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
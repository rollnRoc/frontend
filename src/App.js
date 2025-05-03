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
  
  // ARIMA model parameters
  const [pValue, setPValue] = useState(1);
  const [dValue, setDValue] = useState(1);
  const [qValue, setQValue] = useState(1);
  
  // Prophet model parameters
  const [seasonalityMode, setSeasonalityMode] = useState('additive');
  const [changePointPrior, setChangePointPrior] = useState(0.05);
  const [seasonalityPrior, setSeasonalityPrior] = useState(10);
  
  // XGBoost model parameters
  const [maxDepth, setMaxDepth] = useState(6);
  const [learningRate, setLearningRate] = useState(0.1);
  const [nEstimators, setNEstimators] = useState(100);
  
  // Transformer model parameters
  const [numHeads, setNumHeads] = useState(8);
  const [numEncoderLayers, setNumEncoderLayers] = useState(4);
  const [dropoutRate, setDropoutRate] = useState(0.1);
  const [dimModel, setDimModel] = useState(64);

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
          // ARIMA specific params
          p: parseInt(pValue),
          d: parseInt(dValue),
          q: parseInt(qValue),
          // Prophet specific params
          seasonalityMode,
          changePointPrior: parseFloat(changePointPrior),
          seasonalityPrior: parseFloat(seasonalityPrior),
          // XGBoost specific params
          maxDepth: parseInt(maxDepth),
          learningRate: parseFloat(learningRate),
          nEstimators: parseInt(nEstimators),
          // Transformer specific params
          numHeads: parseInt(numHeads),
          numEncoderLayers: parseInt(numEncoderLayers),
          dropoutRate: parseFloat(dropoutRate),
          dimModel: parseInt(dimModel)
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
                <label>
                  <input
                    type="radio"
                    value="arima"
                    checked={modelType === 'arima'}
                    onChange={() => setModelType('arima')}
                  />
                  ARIMA
                </label>
                <label>
                  <input
                    type="radio"
                    value="prophet"
                    checked={modelType === 'prophet'}
                    onChange={() => setModelType('prophet')}
                  />
                  Prophet
                </label>
                <label>
                  <input
                    type="radio"
                    value="xgboost"
                    checked={modelType === 'xgboost'}
                    onChange={() => setModelType('xgboost')}
                  />
                  XGBoost
                </label>
                <label>
                  <input
                    type="radio"
                    value="transformer"
                    checked={modelType === 'transformer'}
                    onChange={() => setModelType('transformer')}
                  />
                  Transformer
                </label>
              </div>
            </div>
            
            {/* Common Parameters for Deep Learning Models */}
            {(modelType === 'cnn' || modelType === 'lstm' || modelType === 'transformer') && (
              <>
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
              </>
            )}
            
            {/* CNN specific parameters */}
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
            
            {/* LSTM specific parameters */}
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
            
            {/* ARIMA specific parameters */}
            {modelType === 'arima' && (
              <>
                <h3>ARIMA Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>p (AR order):</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={pValue}
                      onChange={(e) => setPValue(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>d (Differencing):</label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={dValue}
                      onChange={(e) => setDValue(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>q (MA order):</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={qValue}
                      onChange={(e) => setQValue(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Prophet specific parameters */}
            {modelType === 'prophet' && (
              <>
                <h3>Prophet Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>Seasonality Mode:</label>
                    <select
                      value={seasonalityMode}
                      onChange={(e) => setSeasonalityMode(e.target.value)}
                    >
                      <option value="additive">Additive</option>
                      <option value="multiplicative">Multiplicative</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Changepoint Prior Scale:</label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={changePointPrior}
                      onChange={(e) => setChangePointPrior(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Seasonality Prior Scale:</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={seasonalityPrior}
                      onChange={(e) => setSeasonalityPrior(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* XGBoost specific parameters */}
            {modelType === 'xgboost' && (
              <>
                <h3>XGBoost Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>Max Depth:</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Learning Rate:</label>
                    <input
                      type="number"
                      min="0.001"
                      max="1"
                      step="0.001"
                      value={learningRate}
                      onChange={(e) => setLearningRate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Estimators:</label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={nEstimators}
                      onChange={(e) => setNEstimators(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Transformer specific parameters */}
            {modelType === 'transformer' && (
              <>
                <h3>Transformer Parameters</h3>
                <div className="parameter-group">
                  <div className="form-group">
                    <label>Number of Heads:</label>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={numHeads}
                      onChange={(e) => setNumHeads(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Encoder Layers:</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={numEncoderLayers}
                      onChange={(e) => setNumEncoderLayers(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Dropout Rate:</label>
                    <input
                      type="number"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={dropoutRate}
                      onChange={(e) => setDropoutRate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Model Dimension:</label>
                    <input
                      type="number"
                      min="16"
                      max="512"
                      step="16"
                      value={dimModel}
                      onChange={(e) => setDimModel(e.target.value)}
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
              {/* Model-specific metrics */}
              {modelType === 'arima' && results.aic && (
                <div className="metric">
                  <h3>AIC:</h3>
                  <p>{results.aic.toFixed(4)}</p>
                </div>
              )}
              {modelType === 'prophet' && results.mape && (
                <div className="metric">
                  <h3>MAPE:</h3>
                  <p>{results.mape.toFixed(4)}%</p>
                </div>
              )}
            </div>
            
            <h3>Prediction Plot</h3>
            <div className="plot-container">
              <img src={`data:image/png;base64,${results.plot}`} alt="Prediction Plot" />
            </div>
            
            {/* Feature importance for XGBoost */}
            {modelType === 'xgboost' && results.featureImportance && (
              <>
                <h3>Feature Importance</h3>
                <div className="plot-container">
                  <img src={`data:image/png;base64,${results.featureImportance}`} alt="Feature Importance" />
                </div>
              </>
            )}
            
            <h3>Training History</h3>
            <div className="training-history">
              {['cnn', 'lstm', 'transformer'].includes(modelType) && results.history && (
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
              )}
              {['arima', 'prophet', 'xgboost'].includes(modelType) && (
                <div className="model-info">
                  <p>Model training completed successfully.</p>
                  {results.trainingTime && (
                    <p>Training time: {results.trainingTime.toFixed(2)} seconds</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
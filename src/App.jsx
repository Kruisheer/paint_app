// src/PaintingApp.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Star, Moon, Eraser } from 'lucide-react'; // Imported Eraser icon
import DOMPurify from 'dompurify';
import axios from 'axios'; // Import axios for API requests

// Import SVGs as raw strings
import fishSVG from './assets/images/fish.svg?raw';
import unicornSVG from './assets/images/unicorn.svg?raw';
import cheetahSVG from './assets/images/cheetah.svg?raw';

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`painting-tabpanel-${index}`}
      aria-labelledby={`painting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const colors = [
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Lime Green', value: '#32CD32' },
  { name: 'Rainbow', value: 'rainbow' },
  { name: 'Eraser', value: 'eraser', icon: Eraser }, // Added Eraser
];

const rainbowColors = ['#FF69B4', '#FFD700', '#87CEEB', '#32CD32', '#8A2BE2', '#FFA500'];

// Updated images array with imported SVGs
const images = [
  { name: 'Fish', svg: fishSVG },
  { name: 'Unicorn', svg: unicornSVG },
  { name: 'Cheetah', svg: cheetahSVG },
];

const PaintingApp = () => {
  const [color, setColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(10);
  const [drawing, setDrawing] = useState(false);
  const [activeLayer, setActiveLayer] = useState(1); // 1: Back, 2: Images, 3: Front
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [tabValue, setTabValue] = useState(0); // For Tabs
  const [stamps, setStamps] = useState([]); // Array to hold all stamps
  const [maxScale, setMaxScale] = useState(3); // Default maximum scale
  const [isEraser, setIsEraser] = useState(false); // Added Eraser state

  // States for Magic Button
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [magicError, setMagicError] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);

  const colorIndexRef = useRef(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const containerRef = useRef(null);

  // Update canvas size based on container size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: height - 400 }); // Adjusted for additional controls
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Fill the base canvas with white or the generated image whenever canvas size or generatedImage changes
  useEffect(() => {
    const baseCanvas = canvasRefs[0].current;
    if (baseCanvas) {
      baseCanvas.width = canvasSize.width;
      baseCanvas.height = canvasSize.height;
      const ctx = baseCanvas.getContext('2d');
      if (generatedImage) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height); // Clear existing content
          ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height); // Draw generated image
        };
        img.src = generatedImage;
      } else {
        ctx.fillStyle = '#FFFFFF'; // White background
        ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
      }
    }

    // Also update other canvases to match the new size
    canvasRefs.slice(1).forEach((canvasRef) => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }, [canvasSize, stamps, generatedImage]); // Added generatedImage to dependencies

  // Handle selected image changes and calculate max scale
  useEffect(() => {
    if (selectedImage) {
      // Parse the SVG to get intrinsic dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(selectedImage.svg, "image/svg+xml");
      const svgElement = svgDoc.querySelector('svg');

      const intrinsicWidth = parseFloat(svgElement.getAttribute('width')) || 100; // Default to 100 if not specified
      const intrinsicHeight = parseFloat(svgElement.getAttribute('height')) || 100;

      // Calculate maximum scale based on canvas size
      const maxScaleX = canvasSize.width / intrinsicWidth;
      const maxScaleY = canvasSize.height / intrinsicHeight;
      const calculatedMaxScale = Math.min(maxScaleX, maxScaleY, 3); // Limit to a maximum of 3x for practicality

      setMaxScale(calculatedMaxScale);
    }
  }, [selectedImage, canvasSize]);

  // Redraw stamps whenever stamps or canvas size changes
  useEffect(() => {
    const canvas = canvasRefs[1].current; // Middle layer for images
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous stamps

      stamps.forEach((stamp) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            stamp.x,
            stamp.y,
            img.width * stamp.scale,
            img.height * stamp.scale
          );
        };
        img.src = `data:image/svg+xml;base64,${btoa(stamp.svg)}`;
      });
    }
  }, [stamps, canvasSize]);

  const getNextColor = () => {
    if (color === 'rainbow') {
      const nextColor = rainbowColors[colorIndexRef.current];
      colorIndexRef.current = (colorIndexRef.current + 1) % rainbowColors.length;
      return nextColor;
    }
    return color;
  };

  const handleColorSelection = (colorValue) => {
    if (colorValue === 'eraser') {
      setIsEraser(true);
      setColor('#FFFFFF'); // Assuming white as the background color
    } else {
      setIsEraser(false);
      setColor(colorValue);
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setDrawing(true);
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = brushSize;

      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = getNextColor();
      }
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      ctx.lineTo(x, y);
      ctx.lineWidth = brushSize;

      if (isEraser) {
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.strokeStyle = getNextColor();
      }

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over'; // Reset to default
    }
  };

  const handleBrushSizeChange = (event, newValue) => {
    setBrushSize(newValue);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler Functions for Save/Load
  const handleSaveAsImage = () => {
    // Create a temporary canvas to combine layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw each layer onto the temporary canvas
    canvasRefs.forEach((canvasRef, index) => {
      const canvas = canvasRef.current;
      if (canvas) {
        tempCtx.drawImage(canvas, 0, 0);
      }
    });

    // Convert the temporary canvas to a data URL and trigger download
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'painting.png';
    link.click();
  };

  const handleSaveProject = () => {
    const state = {
      stamps,
      drawings: canvasRefs.map((canvasRef) => canvasRef.current.toDataURL()),
      generatedImage, // Include generatedImage in the project state
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = 'painting.json';
    link.click();
  };

  const handleLoadImage = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          // Clear all canvases
          canvasRefs.forEach((canvasRef, index) => {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
            if (index === 0) {
              // Fill base canvas with white after clearing
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
            }
          });
          // Draw the loaded image onto the frontmost canvas
          const frontCanvas = canvasRefs[2].current; // Front layer
          const ctx = frontCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid PNG image.');
    }
  };

  const handleLoadProject = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);
          if (state.stamps && state.drawings) {
            setStamps(state.stamps);
            setGeneratedImage(state.generatedImage || null); // Restore generatedImage if present

            // Restore drawings on respective canvases
            state.drawings.forEach((dataURL, index) => {
              const img = new Image();
              img.onload = () => {
                const ctx = canvasRefs[index].current.getContext('2d');
                ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
                if (index === 0 && !state.generatedImage) {
                  // Fill base canvas with white after clearing if no generatedImage
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
                }
                ctx.drawImage(img, 0, 0);
              };
              img.src = dataURL;
            });
          } else {
            alert('Invalid project file.');
          }
        } catch (error) {
          alert('Error loading project. Please ensure the file is a valid JSON.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid JSON project file.');
    }
  };

  const handleCanvasClick = (e) => {
    if (selectedImage) {
      const canvas = canvasRefs[activeLayer - 1].current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Compute imageScale based on brushSize
      const minScale = 0.1; // Minimum scale factor
      const imageScale = (brushSize / 50) * (maxScale - minScale) + minScale;

      // Parse the SVG to get intrinsic dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(selectedImage.svg, "image/svg+xml");
      const svgElement = svgDoc.querySelector('svg');

      const intrinsicWidth = parseFloat(svgElement.getAttribute('width')) || 100; // Default to 100 if not specified
      const intrinsicHeight = parseFloat(svgElement.getAttribute('height')) || 100;

      // Calculate the top-left position to center the SVG at the click point
      const x = clickX - (intrinsicWidth * imageScale) / 2;
      const y = clickY - (intrinsicHeight * imageScale) / 2;

      // Add the new stamp to the stamps array
      setStamps([...stamps, { svg: selectedImage.svg, x, y, scale: imageScale }]);

      // Reset selection
      setSelectedImage(null);
    }
  };

  // Compute imageScale for the preview based on brushSize
  const getPreviewScale = () => {
    if (!selectedImage) return 1;
    const minScale = 0.1; // Minimum scale factor
    return (brushSize / 50) * (maxScale - minScale) + minScale;
  };

  // Determine cursor style based on Eraser mode
  const getCursorStyle = () => {
    return isEraser ? 'cell' : 'crosshair';
  };

  // **Magic Button Handler**
  const handleMagicButton = async () => {
    setLoadingMagic(true);
    setMagicError(null);
    setGeneratedImage(null); // Reset any previous generated image

    try {
      // Create a temporary canvas to combine layers
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasSize.width;
      tempCanvas.height = canvasSize.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Draw each layer onto the temporary canvas
      canvasRefs.forEach((canvasRef, index) => {
        const canvas = canvasRef.current;
        if (canvas) {
          tempCtx.drawImage(canvas, 0, 0);
        }
      });

      // Convert the temporary canvas to a data URL
      const dataURL = tempCanvas.toDataURL('image/png');

      // Convert data URL to base64 string
      const base64Image = dataURL.split(',')[1]; // Remove the data:image/png;base64, prefix

      // Get image dimensions
      const dimensions = await getImageDimensionsFromDataURL(dataURL);
      const { width, height } = dimensions;

      // Prepare the payload
      const payload = {
        prompt: "A realistic, happy, magical rainbow unicorn horse, sparkles shimmering all around. Cheerful and enchanting, soft pastel colors and a whimsical, fairy-tale feel.",
        negative_prompt: "Splotchy, ugly, messy, drawing, painting, scary, boring",
        steps: 20,
        cfg_scale: 7.5,
        width: width,
        height: height,
        sampler_name: "Euler a",
        model: "3dAnimationDiffusion_v10.safetensors [31829c378d]",
        alwayson_scripts: {
          controlnet: {
            args: [
              {
                input_image: base64Image, // Pure base64 string
                module: "scribble_pidinet",
                model: "control_v11p_sd15_scribble [61dd9fb9]",
                processor_res: 512,
                guidance_start: 0.0,
                guidance_end: 1.0,
                control_mode: "ControlNet is more important",
              },
            ],
          },
        },
      };

      console.log('Magic Payload:', payload);

      const API_URL = "https://sd.ngrok.pro/sdapi/v1/txt2img";

      // Make the API request
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Magic API Response:', response);

      if (response.status === 200) {
        const imageDataBase64 = response.data.images[0];
        const generatedDataURL = `data:image/png;base64,${imageDataBase64}`;
        setGeneratedImage(generatedDataURL); // This will trigger useEffect to draw on back canvas

        // Clear stamps and other layers by updating state
        setStamps([]); // This clears the middle layer stamps and triggers the useEffect to clear other canvases
      } else {
        setMagicError(`Failed to generate image. Status code: ${response.status}`);
        console.error('Magic API Response Data:', response.data);
      }
    } catch (err) {
      console.error('Magic Error Details:', err);
      if (err.response) {
        // The request was made, and the server responded with a status code outside 2xx
        console.error('Magic Response Data:', err.response.data);
        setMagicError(`Error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        // The request was made, but no response was received
        console.error('Magic No response received:', err.request);
        setMagicError('No response received from the server.');
      } else {
        // Something happened in setting up the request
        console.error('Magic Error Message:', err.message);
        setMagicError(`Error: ${err.message}`);
      }
    } finally {
      setLoadingMagic(false);
    }
  };

  // Utility function to get image dimensions from Data URL
  const getImageDimensionsFromDataURL = (dataURL) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataURL;
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
    });
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh', // Changed from height to minHeight
        width: '100vw',
        overflowY: 'auto', // Allow vertical scrolling
        background: 'linear-gradient(to bottom, #FFE6F0, #E6E6FA)',
      }}
    >
      <Typography variant="h4" align="center" color="primary" sx={{ py: 1 }}>
        Magic Painting!
      </Typography>
      
      {/* Image Selection Panel */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2, // Increased gap for better spacing
          p: 2,   // Increased padding for better spacing
          flexWrap: 'wrap',
        }}
      >
        {images.map((img) => (
          <Button
            key={img.name}
            variant={selectedImage && selectedImage.svg === img.svg ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedImage(img);
            }}
            sx={{
              textTransform: 'none',
              width: 80,
              height: 80,
              padding: 0, // Remove padding to utilize full button size
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
            }}
            aria-label={`Select ${img.name} stamp`}
          >
            {/* Using <img> tag for better control over SVG sizing */}
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(img.svg)}`}
              alt={img.name}
              style={{
                width: '60%', // 60% of the button size
                height: '60%', // 60% of the button size
                objectFit: 'contain',
              }}
            />
          </Button>
        ))}
      </Box>
      
      {/* Preview and Instructions */}
      {selectedImage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1, flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Adjust Brush Size to Scale Stamp:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Slider
              value={brushSize}
              onChange={handleBrushSizeChange}
              min={1}
              max={50}
              step={1}
              sx={{ width: 200 }}
            />
            <Box
              sx={{
                width: 60,
                height: 60,
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Preview of the SVG with current brush size */}
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(selectedImage.svg)}`}
                alt="Stamp Preview"
                style={{
                  width: `${getPreviewScale() * 60}px`, // Scale based on brush size
                  height: `${getPreviewScale() * 60}px`,
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Click on the canvas to place the stamp.
          </Typography>
        </Box>
      )}
      
      {/* Layer and Canvas Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Stack on small screens
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Layer Controls */}
        <Box
          sx={{
            width: { xs: '100%', md: 80 }, // Full width on small screens
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 1,
          }}
        >
          {[
            { layer: 1, icon: Star, label: 'Back' },
            // Removed the middle layer button
            { layer: 3, icon: Moon, label: 'Front' }
          ].map(({ layer, icon: Icon, label }) => (
            <Button
              key={layer}
              variant={layer === activeLayer ? 'contained' : 'outlined'}
              onClick={() => setActiveLayer(layer)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Select ${label} layer`}
            >
              <Icon size={24} />
              <Typography variant="caption" sx={{ mt: 0.5 }}>{label}</Typography>
            </Button>
          ))}
        </Box>
        
        {/* Canvas Area */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            border: '4px solid',
            borderColor: 'secondary.light',
            borderRadius: 2,
            overflow: 'hidden',
            touchAction: 'none',
            height: { xs: 300, md: 'auto' }, // Set a fixed height on small screens
            cursor: getCursorStyle(),
          }}
        >
          {canvasRefs.map((canvasRef, index) => (
            <canvas
              key={index}
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: index + 1, // Ensure proper stacking order
                display: 'block', // Always display all layers
                opacity: 1,
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onClick={handleCanvasClick} // Handle stamp placement
            />
          ))}
          
          {/* **Display Generated Image (Magic Result) - Optional** */}
          {generatedImage && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 2,
                borderRadius: 2,
                boxShadow: 3,
                maxWidth: '80%',
                maxHeight: '80%',
                overflow: 'auto',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Generated Image
              </Typography>
              <img
                src={generatedImage}
                alt="Generated"
                style={{ maxWidth: '100%', maxHeight: '400px' }}
              />
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="primary"
                  href={generatedImage}
                  download="generated_image.png"
                >
                  Download
                </Button>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Color Palette */}
        <Box
          sx={{
            width: { xs: '100%', md: 80 }, // Full width on small screens
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 1,
          }}
        >
          {colors.map((colorOption) => (
            <Button
              key={colorOption.name}
              variant={colorOption.value === (isEraser ? 'eraser' : color) ? 'contained' : 'outlined'}
              onClick={() => handleColorSelection(colorOption.value)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                mb: 1,
                backgroundColor: colorOption.value === 'rainbow' ? 'white' : (colorOption.value === 'eraser' ? 'transparent' : colorOption.value),
                border: (colorOption.value === 'eraser' || colorOption.value === color) ? '4px solid' : 'none',
                borderColor: 'secondary.main',
                '&:hover': {
                  backgroundColor: colorOption.value === 'rainbow' ? 'grey.100' : (colorOption.value === 'eraser' ? '#f0f0f0' : colorOption.value),
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Select ${colorOption.name} ${colorOption.value === 'eraser' ? 'Eraser' : 'color'}`}
            >
              {colorOption.value === 'rainbow' ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(to right, #FF69B4, #FFD700, #87CEEB)',
                  }}
                />
              ) : colorOption.value === 'eraser' ? (
                <Eraser size={24} /> // Display Eraser icon
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: colorOption.value,
                  }}
                />
              )}
            </Button>
          ))}
        </Box>
      </Box>
      
      {/* Brush Size Slider */}
      <Card
        sx={{
          m: 1,
          order: { xs: 3, md: 2 }, // Position before Save/Load on small screens
        }}
      >
        <CardHeader title="Brush Size" sx={{ py: 1 }} />
        <CardContent>
          <Slider
            value={brushSize}
            onChange={handleBrushSizeChange}
            min={1}
            max={50}
            step={1}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">Small</Typography>
            <Typography variant="caption">Big</Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Save/Load and Magic Buttons Positioned Below Brush Size Slider */}
      <Box
        sx={{
          width: '100%',
          mb: 2,
          px: 2,
          order: { xs: 4, md: 3 }, // Ensure it's below the slider on small screens
        }}
      >
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Save/Load" />
          <Tab label="Magic" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {/* Save and Load Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Stack on extra-small screens
              justifyContent: 'center',
              gap: 2,
              p: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Save as Image */}
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveAsImage}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Save as Image
            </Button>

            {/* Save Project (JSON) */}
            <Button
              variant="contained"
              color="info"
              onClick={handleSaveProject}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Save Project
            </Button>

            {/* Load Image */}
            <Button
              variant="contained"
              color="primary"
              component="label"
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Load Image
              <input
                type="file"
                accept="image/png"
                hidden
                onChange={handleLoadImage}
              />
            </Button>

            {/* Load Project */}
            <Button
              variant="contained"
              color="secondary"
              component="label"
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Load Project
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={handleLoadProject}
              />
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Magic Button and API Interaction */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 2,
            }}
          >
            <Button
              variant="contained"
              color="warning"
              onClick={handleMagicButton}
              disabled={loadingMagic}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              {loadingMagic ? <CircularProgress size={24} color="inherit" /> : 'Magic'}
            </Button>

            {/* Display Magic Errors */}
            {magicError && (
              <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
                {magicError}
              </Alert>
            )}

            {/* Display Generated Image is handled above within Canvas Area */}
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PaintingApp;

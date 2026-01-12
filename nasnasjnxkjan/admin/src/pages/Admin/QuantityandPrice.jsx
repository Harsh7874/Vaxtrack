import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';

function QuantityAndPrice() {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalVaccines, setHospitalVaccines] = useState([]);
  const [newVaccineId, setNewVaccineId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for search input

      const { hospitals, aToken , getAllHospitals} = useContext(AdminContext)
      const { vaccines , getAllVaccines} = useContext(AdminContext)
    
          useEffect(() => {
            if (aToken) {
                getAllHospitals()
                getAllVaccines()
            }
        }, [aToken])

  const handleHospitalClick = async (hospitalId) => {
    setSelectedHospital(hospitalId);
    try {
      const response = await axios.get(`http://localhost:4000/api/admin/all-hospitals/${hospitalId}`,{ headers: { aToken } });
      setHospitalVaccines(response.data);
    } catch (error) {
      console.error('Error fetching hospital vaccines:', error);
    }
  };

  
  const handleAddVaccine = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !newVaccineId || !newPrice || !newQuantity) {
      alert('Please fill all fields');
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/admin/add-price', {
        hospital: selectedHospital,
        vaccine: newVaccineId,
        price: parseFloat(newPrice),
        quantity: parseInt(newQuantity),
      });
      alert('Vaccine added successfully');
      setNewVaccineId('');
      setNewPrice('');
      setNewQuantity('');
      handleHospitalClick(selectedHospital); // Refresh the list
    } catch (error) {
      alert('Error adding vaccine');
    }
  };

  // Filter hospitals based on search query
  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log(hospitalVaccines); // Add this above the return

  return (
    <div>
      <Typography variant="h5">Hospitals</Typography>
      
      {/* Search Bar */}
      <TextField
        label="Search Hospitals"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        style={{ margin: '20px 0' }}
      />
 <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      marginBottom: '30px',
    }}
  >
      {filteredHospitals.length > 0 ? (
        filteredHospitals.map((hospital) => (
          <Card
            key={hospital._id}
            onClick={() => handleHospitalClick(hospital._id)}
            style={{ margin: '10px', cursor: 'pointer' }}
          >
            <CardContent>
              <Typography variant="h6">{hospital.name}</Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography>No hospitals match your search.</Typography>
      )}
      </div>

      {selectedHospital && (
        <div>
          <Typography variant="h5">Vaccines for Selected Hospital</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vaccine Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hospitalVaccines.map((hv) => (
                <TableRow key={hv._id}>
                  <TableCell>{hv.vaccine?.name}</TableCell>
                  <TableCell>{hv.price}</TableCell>
                  <TableCell>{hv.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Form to add a new vaccine */}
          <Typography variant="h6" style={{ marginTop: '20px' }}>Add New Vaccine</Typography>
          <form onSubmit={handleAddVaccine} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <FormControl fullWidth>
              <InputLabel>Vaccine</InputLabel>
              <Select
                value={newVaccineId}
                onChange={(e) => setNewVaccineId(e.target.value)}
                label="Vaccine"
              >
                {vaccines.map((vaccine) => (
                  <MenuItem key={vaccine._id} value={vaccine._id}>
                    {vaccine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              type="number"
              fullWidth
            />
            <TextField
              label="Quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              type="number"
              fullWidth
            />
            <Button type="submit" variant="contained">Add Vaccine</Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default QuantityAndPrice;
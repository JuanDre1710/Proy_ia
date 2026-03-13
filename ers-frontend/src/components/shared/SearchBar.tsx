import { FormEvent, useState } from 'react';
import { Button, Card, CardContent, Stack, TextField } from '@mui/material';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import { SearchIdentifier } from '../../models/domain';
import { validateIdentifier } from '../../utils/identifier';

interface SearchBarProps {
  onSearch: (identifier: SearchIdentifier) => void;
}

export function SearchBar({ onSearch }: SearchBarProps): JSX.Element {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const parsed = validateIdentifier(value);
    if (!parsed) {
      setError('Ingresa un identificador valido de 8 u 11 digitos.');
      return;
    }
    setError('');
    onSearch(parsed);
  };

  return (
    <Card>
      <CardContent component="form" onSubmit={handleSubmit}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
          <TextField
            fullWidth
            label="DNI, CUIL o CUIT"
            placeholder="Ej. 30111222 o 20333444556"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={!!error}
            helperText={error || ' '}
          />
          <Button type="submit" variant="contained" startIcon={<ManageSearchRoundedIcon />} sx={{ minWidth: { md: 190 } }}>
            Evaluar riesgo
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

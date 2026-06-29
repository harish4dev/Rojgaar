import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'
import { buildLocationLabel, detectBrowserLocation, type LocationValue } from '@/utils/location'
import './LocationInput.css'

interface Props {
  value: LocationValue
  onChange: (next: LocationValue) => void
  autoDetect?: boolean
  disabled?: boolean
}

export default function LocationInput({ value, onChange, autoDetect = false, disabled }: Props) {
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationValue[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runDetect = useCallback(async () => {
    setDetecting(true)
    setDetectError('')
    try {
      const coords = await detectBrowserLocation()
      const result = await api.reverseGeocode(coords.latitude, coords.longitude)
      onChange(result)
      setQuery(result.location_label)
    } catch {
      setDetectError('Could not detect location. Search or enter manually below.')
    } finally {
      setDetecting(false)
    }
  }, [onChange])

  useEffect(() => {
    if (!autoDetect) return
    void runDetect()
  }, [autoDetect, runDetect])

  useEffect(() => {
    if (value.location_label && !query) {
      setQuery(value.location_label)
    }
  }, [value.location_label, query])

  const handleSearch = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const rows = await api.searchPlaces(text.trim())
        setSuggestions(rows)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }

  const pickSuggestion = (item: LocationValue) => {
    onChange(item)
    setQuery(item.location_label)
    setSuggestions([])
  }

  const updateField = (field: 'locality' | 'city', text: string) => {
    const next = {
      ...value,
      [field]: text,
      location_label: buildLocationLabel(
        field === 'locality' ? text : value.locality,
        field === 'city' ? text : value.city,
      ),
    }
    onChange(next)
    setQuery(next.location_label)
  }

  return (
    <div className="location-input">
      {autoDetect && detecting && (
        <p className="location-input__status">Detecting your location…</p>
      )}
      {detectError && <p className="location-input__error">{detectError}</p>}

      <label htmlFor="location-search">Location</label>
      <input
        id="location-search"
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => handleSearch(e.target.value)}
        autoComplete="off"
      />
      {searching && <p className="location-input__hint">Searching…</p>}
      {suggestions.length > 0 && (
        <ul className="location-input__suggestions">
          {suggestions.map((item) => (
            <li key={`${item.location_lat}-${item.location_lng}-${item.location_label}`}>
              <button type="button" onClick={() => pickSuggestion(item)}>
                {item.location_label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="location-input__row">
        <div>
          <label htmlFor="location-locality">Locality</label>
          <input
            id="location-locality"
            type="text"
            value={value.locality}
            disabled={disabled}
            onChange={(e) => updateField('locality', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="location-city">City</label>
          <input
            id="location-city"
            type="text"
            value={value.city}
            disabled={disabled}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

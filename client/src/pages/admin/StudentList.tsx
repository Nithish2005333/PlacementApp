import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import LogoutSuccessPopup from '../../components/LogoutSuccessPopup'
import FilterSuccessPopup from '../../components/FilterSuccessPopup'
import SuccessPopup from '../../components/SuccessPopup'
import ErrorPopup from '../../components/ErrorPopup'
import PasswordInput from '../../components/PasswordInput'
import api from '../../lib/api'
import * as XLSX from 'xlsx'

export default function StudentList() {
  const q = new URLSearchParams(useLocation().search)
  const year = q.get('year') || ''
  const department = q.get('department') || ''
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [showFilterSuccessPopup, setShowFilterSuccessPopup] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({
    willingToPlace: [] as string[],
    historyOfArrears: [] as string[],
    currentArrears: [] as string[],
    cgpaRange: '',
    technicalSkills: [] as string[],
    softSkills: [] as string[],
    gender: '',
    year: '',
    department: '',
    hscPercentage: '',
    sslcPercentage: '',
    hasInternship: [] as string[],
    hasProjects: [] as string[],
    hasCertifications: [] as string[]
  })
  const [tempSkill, setTempSkill] = useState({ technical: '', soft: '' })
  const [filteredRows, setFilteredRows] = useState<any[]>([])
  const [isFiltered, setIsFiltered] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [showStaffCreateModal, setShowStaffCreateModal] = useState(false)
  const [staffCreateForm, setStaffCreateForm] = useState({ username: '', password: '', name: '', email: '', department: department || '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyPurpose, setVerifyPurpose] = useState<'create_staff'|'delete_staff'|null>(null)
  const [verifyTargetUsername, setVerifyTargetUsername] = useState<string>('')
  const [verifyForm, setVerifyForm] = useState({ username: '', password: '' })
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [showRepModal, setShowRepModal] = useState(false)
  
  // Upload Results Modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [repForm, setRepForm] = useState({ username: '', password: '', name: '', email: '' })
  const [repList, setRepList] = useState<Array<{ username: string, name?: string, email?: string, department?: string, year?: string }>>([])
  const [showRepDeleteModal, setShowRepDeleteModal] = useState(false)
  const [repToDelete, setRepToDelete] = useState<string>('')
  const [showRepSingleDeleteModal, setShowRepSingleDeleteModal] = useState(false)
  const [repSingleDeleteId, setRepSingleDeleteId] = useState<string | null>(null)
  const [showRepEditModal, setShowRepEditModal] = useState(false)
  const [editingRep, setEditingRep] = useState<{ username: string, name?: string, email?: string } | null>(null)
  const [repEditForm, setRepEditForm] = useState({ username: '', name: '', email: '', password: '' })
  const [showRepEditPassword, setShowRepEditPassword] = useState(false)
  const [expandedRep, setExpandedRep] = useState<string | null>(null)
  
  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }
  const navigate = useNavigate()

  console.log('StudentList URL params:', { year, department, search: useLocation().search })

  // Anna University Grade System (CBCS)
  const gradePoints: { [key: string]: number } = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'U': 0
  }



  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setShowLogoutPopup(true)
  }

  const handleCloseLogoutPopup = () => {
    setShowLogoutPopup(false)
  }

  // Upload Results Functions
  const getGradePoints = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'AB': 0, 'I': 0
    }
    return gradeMap[grade.toUpperCase()] || 0
  }

  // Get credits from Excel file data
  const getSubjectCredits = (subjectCode: string, row: any, subjectCreditsMap?: { [key: string]: number }): number => {
    // First try to get credits from the subject credits map (Row 2)
    if (subjectCreditsMap) {
      const columnIndex = Object.keys(row).indexOf(subjectCode)
      if (columnIndex >= 0) {
        const creditKey = `col_${columnIndex}`
        if (subjectCreditsMap[creditKey]) {
          return subjectCreditsMap[creditKey]
        }
      }
    }
    
    // Look for credit information in the same row
    const creditPatterns = [
      'credit', 'credits', 'credit hours', 'course credits',
      'sub credit', 'sub credit', 'subject credit', 'subject credits'
    ]
    
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase()
      if (creditPatterns.some(pattern => lowerKey.includes(pattern))) {
        const creditValue = parseFloat(value?.toString() || '0')
        if (!isNaN(creditValue) && creditValue > 0) {
          return creditValue
        }
      }
    }
    
    // Default to 0 if no credits found in the file
    return 0
  }

  // Auto-detect semester from subject codes
  const detectSemester = (subjectCodes: string[]): number => {
    const semesterSubjects: { [key: string]: string[] } = {
      '1': ['IP3151', 'HS3152', 'MA3151', 'PH3151', 'CY3151', 'GE3151', 'GE3152', 'GE3171', 'BS3171', 'GE3172'],
      '2': ['HS3252', 'MA3251', 'PH3256', 'BE3251', 'GE3251', 'CS3251', 'GE3252', 'NCC-L1', 'GE3271', 'CS3271', 'GE3272'],
      '3': ['MA3354', 'CS3351', 'CS3352', 'CS3301', 'CS3391', 'CS3311', 'CS3381', 'CS3361', 'GE3361'],
      '4': ['CS3452', 'CS3491', 'CS3492', 'CS3401', 'CS3451', 'GE3451', 'NCC-L2', 'CS3461', 'CS3481'],
      '5': ['CS3591', 'CS3501', 'CB3491', 'CS3551'],
      '6': ['CCS356', 'CS3691', 'NCC-L3'],
      '7': ['GE3791', 'CS3711'],
      '8': ['CS3811']
    }

    for (let sem = 1; sem <= 8; sem++) {
      const semSubjects = semesterSubjects[sem.toString()]
      const foundSubjects = subjectCodes.filter(code => semSubjects.includes(code))
      if (foundSubjects.length >= 2) { // If at least 2 subjects match, it's likely this semester
        return sem
      }
    }
    
    return 1 // Default to semester 1 if no match
  }

  const calculateSGPA = (subjects: any[]): number => {
    let totalGradePoints = 0
    let totalCredits = 0

    subjects.forEach(subject => {
      const credits = parseFloat(subject.credits) || 0 // Default to 0 if no credits found
      const gradePoints = getGradePoints(subject.grade)
      totalGradePoints += gradePoints * credits
      totalCredits += credits
    })

    return totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0
  }

  const calculateCGPA = (semesters: any[]): number => {
    let totalGradePoints = 0
    let totalCredits = 0

    semesters.forEach(semester => {
      if (semester.sgpa && semester.totalCredits) {
        totalGradePoints += semester.sgpa * semester.totalCredits
        totalCredits += semester.totalCredits
      }
    })

    return totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0
  }


  const handleExcelUpload = async () => {
    if (!excelFile) {
      showErrorMessage('Please select a file')
      return
    }

    setUploadingExcel(true)
    try {
      const data = await excelFile.arrayBuffer()
      
      // Handle Excel files
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Check if worksheet exists and has data
      if (!worksheet || !worksheet['!ref']) {
        showErrorMessage('Excel file appears to be empty or corrupted. Please ensure the file contains data.')
        return
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Get raw data first to check structure
        defval: null 
      })
      
      console.log('Raw Excel data:', jsonData)
      console.log('Total rows in Excel:', jsonData.length)
      
      // Filter out completely empty rows
      const filteredData = jsonData.filter((row: any) => 
        row && Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')
      )
      
      console.log('Filtered data rows:', filteredData.length)
      console.log('First few rows:', filteredData.slice(0, 5))
      
      if (filteredData.length === 0) {
        showErrorMessage('Excel file contains no data. Please ensure the file has content.')
        return
      }
      
      // Handle the specific multi-row header format from the user's file
      // Row 1: Semester (all cells contain semester number)
      // Row 2: Subject Credits
      // Row 3: Subject Codes
      // Row 4: Subject Names
      // Row 5: "Student n Register n" and "Grade" labels
      // Row 6+: Student data
      
      if (filteredData.length < 6) {
        showErrorMessage('Excel file format is invalid. Expected at least 6 rows with multi-row headers and student data.')
        return
      }
      
      // Extract semester from Row 1
      const semesterRow = filteredData[0] as string[]
      const semester = semesterRow.find(cell => cell && cell.toString().trim() !== '' && cell.toString().trim() !== 'Semester') || '1'
      console.log('Detected semester from Row 1:', semester)
      
      // Extract subject credits from Row 2
      const creditRow = filteredData[1] as string[]
      const subjectCredits: { [key: string]: number } = {}
      creditRow.forEach((credit, index) => {
        if (credit && !isNaN(parseFloat(credit.toString())) && credit.toString().trim() !== 'subject Credit') {
          subjectCredits[`col_${index}`] = parseFloat(credit.toString())
        }
      })
      console.log('Subject credits from Row 2:', subjectCredits)
      
      // Extract subject codes from Row 3
      const subjectCodeRow = filteredData[2] as string[]
      const subjectCodes: string[] = []
      subjectCodeRow.forEach((code, index) => {
        if (code && typeof code === 'string' && code.trim() !== '' && code.trim() !== 'Subject code') {
          subjectCodes.push(code.trim())
        }
      })
      console.log('Subject codes from Row 3:', subjectCodes)
      
      // Extract subject names from Row 4
      const subjectNameRow = filteredData[3] as string[]
      const subjectNames: { [key: string]: string } = {}
      subjectNameRow.forEach((name, index) => {
        if (name && typeof name === 'string' && name.trim() !== '' && name.trim() !== 'Subject name') {
          subjectNames[`col_${index}`] = name.trim()
        }
      })
      console.log('Subject names from Row 4:', subjectNames)
      
      // Use Row 3 (subject codes) as headers for data processing
      const headers = subjectCodeRow
      const dataStartIndex = 5 // Student data starts from Row 6 (index 5)
      
      console.log('Using Row 3 as headers:', headers)
      console.log('Student data starts from row:', dataStartIndex + 1)
      
      // Get student data starting from the determined row
      const dataRows = filteredData.slice(dataStartIndex).map((row: any) => {
        if (!Array.isArray(row)) return null
        const obj: any = {}
        headers.forEach((header, index) => {
          if (header && header !== '__EMPTY' && header !== '__EMPTY_' + index) {
            obj[header] = row[index] || ''
          }
        })
        return obj
      }).filter((obj): obj is any => obj && Object.keys(obj).length > 0)
      
      console.log('Headers found:', headers)
      console.log('Processed data rows:', dataRows.length)
      console.log('Sample data row keys:', Object.keys(dataRows[0] || {}))
      console.log('Sample data row values:', dataRows[0])

      if (dataRows.length === 0) {
        showErrorMessage('Excel file contains no valid data rows. Please ensure the file has proper data.')
        return
      }

      // Check if the file has the expected structure
      const firstRow = dataRows[0] as any
      console.log('First row keys:', Object.keys(firstRow || {}))
      
      // Try a completely different approach - parse Excel as array of arrays
      console.log('Raw Excel data structure:', dataRows)
      console.log('Number of rows:', dataRows.length)
      
      // Try parsing as array of arrays instead of objects
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array format instead of object format
        defval: null,
        raw: false
      })
      
      console.log('Raw array data:', rawData)
      console.log('Number of array rows:', rawData.length)
      
      // Check if we have enough rows
      if (rawData.length < 6) {
        showErrorMessage('Excel file does not have enough rows. Expected format requires at least 6 rows (5 header rows + student data).')
        return
      }

      // Look for registration numbers in the array format
      let hasRegistrationNumbers = false
      let studentDataRows = []
      
      for (let i = 5; i < rawData.length; i++) {
        const row = rawData[i]
        if (Array.isArray(row)) {
          // Check all values in the row for registration numbers
          const hasRegNumber = row.some(value => {
            if (typeof value === 'string' || typeof value === 'number') {
              const str = String(value).trim()
              return /^7100\d{8}$/.test(str) || /^\d{12}$/.test(str)
            }
            return false
          })
          
          if (hasRegNumber) {
            hasRegistrationNumbers = true
            studentDataRows.push(row)
            console.log(`Found student data row ${i}:`, row)
          }
        }
      }

      console.log(`Found ${studentDataRows.length} student data rows`)

      if (!hasRegistrationNumbers || studentDataRows.length === 0) {
        // Show more detailed error information
        console.log('First few rows of raw data:')
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          console.log(`Row ${i}:`, rawData[i])
        }
        
        showErrorMessage(`Excel file does not contain student data with registration numbers. Found ${rawData.length} rows total. Please ensure your Excel file has student data rows (Row 6+) with registration numbers starting with 7100.`)
        return
      }

      // Parse the Excel data based on the actual format
      const processedData: any[] = []
      
      console.log('All Excel data:', dataRows)
      console.log('First few rows:', dataRows.slice(0, 5))
      
      // Extract subject information from the header rows (rows 1-4) using array format
      let subjectInfo: { [key: number]: { name: string, credits: number, code: string } } = {}
      let semesterNumber = 1
      
      // Row 1: Semester information - try multiple detection methods
      if (rawData[0] && Array.isArray(rawData[0])) {
        const semesterRow = rawData[0]
        console.log('Array-based semester row:', semesterRow)
        
        // Method 1: Look for numeric values
        const semesterValues = semesterRow.filter(v => typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v)))
        console.log('Filtered semester values:', semesterValues)
        
        // Method 2: Look for semester patterns in text
        const textSemesterValues = semesterRow.filter(v => {
          if (typeof v === 'string') {
            const match = v.match(/sem(?:ester)?\s*(\d+)/i) || v.match(/^s(\d+)$/i)
            return match && parseInt(match[1]) >= 1 && parseInt(match[1]) <= 8
          }
          return false
        })
        console.log('Text-based semester values:', textSemesterValues)
        
        // Use the first valid semester found
        if (semesterValues.length > 0) {
          semesterNumber = parseInt(String(semesterValues[0])) || 1
          console.log('Detected semester number from numeric values:', semesterNumber)
        } else if (textSemesterValues.length > 0) {
          const match = String(textSemesterValues[0]).match(/sem(?:ester)?\s*(\d+)/i) || String(textSemesterValues[0]).match(/^s(\d+)$/i)
          if (match) {
            semesterNumber = parseInt(match[1]) || 1
            console.log('Detected semester number from text values:', semesterNumber)
          }
        } else {
          console.log('No semester detected in Row 1, using default semester 1')
          semesterNumber = 1
        }
      }
      
      // Row 2: Subject credits
      const creditsRow = rawData[1] || []
      
      // Row 3: Subject codes
      const subjectCodesRow = rawData[2] || []
      
      // Row 4: Subject names
      const subjectNamesRow = rawData[3] || []
      
      // Build subject information using array indices
      if (Array.isArray(subjectCodesRow)) {
        subjectCodesRow.forEach((subjectCode: any, index: number) => {
          if (subjectCode && typeof subjectCode === 'string' && subjectCode.trim()) {
            const subjectName = (subjectNamesRow as any[])[index] || subjectCode
            const credits = parseFloat(String((creditsRow as any[])[index])) || 0
            
            subjectInfo[index] = {
              name: subjectName,
              credits: credits,
              code: subjectCode
            }
            console.log(`Found subject at index ${index}: ${subjectCode} -> ${subjectName} (${credits} credits)`)
          }
        })
      }

      // Map each column to its semester based on Row 1
      const columnSemester: { [key: number]: number } = {}
      if (rawData[0] && Array.isArray(rawData[0])) {
        const semRow = rawData[0]
        semRow.forEach((val: any, idx: number) => {
          let semForCol: number | null = null
          if (typeof val === 'number' && Number.isFinite(val)) {
            semForCol = parseInt(String(val))
          } else if (typeof val === 'string') {
            const trimmed = val.trim()
            const m = trimmed.match(/sem(?:ester)?\s*(\d+)/i) || trimmed.match(/^s(\d+)$/i) || trimmed.match(/^(\d+)$/)
            if (m) {
              semForCol = parseInt(m[1] || m[0])
            }
          }
          if (semForCol && semForCol >= 1 && semForCol <= 8) {
            columnSemester[idx] = semForCol
          }
        })
      }

      // Helper: for any subject column that didn't get a semester (blank cell),
      // use the nearest non-empty semester value from the left, otherwise from the right,
      // and only as a last resort fall back to defaultSemester.
      const getSemesterForColumn = (idx: number): number | null => {
        if (columnSemester[idx] !== undefined) return columnSemester[idx]
        // search left
        for (let i = idx - 1; i >= 0; i--) {
          if (columnSemester[i] !== undefined) return columnSemester[i]
        }
        // search right
        const semRow = rawData[0] as any[]
        const maxIdx = Array.isArray(semRow) ? semRow.length - 1 : idx + 10
        for (let i = idx + 1; i <= maxIdx; i++) {
          if (columnSemester[i] !== undefined) return columnSemester[i]
        }
        // fallback
        const fallback = parseInt(semester.toString()) || 1
        return fallback
      }
      
      // Use the student data rows we found
      const validDataRows = studentDataRows

      console.log('Found valid data rows:', validDataRows.length)
      console.log('Sample data row:', validDataRows[0])
      console.log('Subject info found:', subjectInfo)

      if (validDataRows.length === 0) {
        console.log('No valid data rows found. Sample row keys:', Object.keys(dataRows[0] || {}))
        console.log('Sample row values:', dataRows[0])
        
        // Try alternative parsing approach
        console.log('Trying alternative parsing approach...')
        try {
          const alternativeData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null,
            raw: false
          })
          
          console.log('Alternative data:', alternativeData)
          
          // Try to find any row with data
          const anyDataRows = alternativeData.filter((row: any) => {
            if (!row || !Array.isArray(row)) return false
            return row.some(cell => cell && cell.toString().trim() !== '')
          })
          
          console.log('Alternative data rows found:', anyDataRows.length)
          
          if (anyDataRows.length > 0) {
            console.log('First alternative row:', anyDataRows[0])
            showErrorMessage(`Found ${anyDataRows.length} rows of data but couldn't parse them properly. Please check the console for details and ensure your Excel file has the correct format.`)
            return
          }
        } catch (error) {
          console.log('Alternative parsing failed:', error)
        }
        
        showErrorMessage('No valid data found in Excel file. Please ensure your Excel file has proper student data with registration numbers and subject grades.')
        return
      }

      // Use the semester from Row 1 as default, but allow per-student semester detection
      const defaultSemester = parseInt(semester.toString()) || 1
      console.log('=== SEMESTER DETECTION DEBUG ===')
      console.log('Semester row data:', semesterRow)
      console.log('Extracted semester value:', semester)
      console.log('Default semester (parsed):', defaultSemester)
      console.log('Type of semester:', typeof semester)
      console.log('Type of defaultSemester:', typeof defaultSemester)
      console.log('================================')
      
      // Update the selected semester
      setSelectedSemester(defaultSemester)

      validDataRows.forEach((row: any, index: number) => {
        console.log(`Processing student row ${index + 1}:`, row)
        
        if (!Array.isArray(row)) {
          console.log('Skipping non-array row:', row)
          return
        }
        
        // Find the registration number in the row, tolerant to formats
        let registerNumber = ''
        let studentName = ''
        
        // Look for registration number (allow 10-12 digits, with or without 7100 prefix, tolerate spaces)
        row.forEach((value) => {
          if (typeof value === 'string' || typeof value === 'number') {
            const raw = String(value).replace(/\s+/g, '')
            // Common cases: 7100XXXXXXXX, 12 digits, or 10-12 digits where last 10 are the reg
            if (/^7100\d{8}$/.test(raw) || /^\d{12}$/.test(raw)) {
              registerNumber = raw
            } else if (/^\d{10,12}$/.test(raw)) {
              // Fallback: take last 10 digits when 10-12 digit numeric appears
              registerNumber = raw.slice(-10)
            }
          }
        })
        
        // Look for student name (non-numeric, not subject code)
        row.forEach((value, colIndex) => {
          if (typeof value === 'string' && value.trim() && 
              !/^7100\d{8}$/.test(value.trim()) && 
              !/^[A-Z]{2}\d{4}$/.test(value.trim()) &&
              !/^[A-Z]$/.test(value.trim()) &&
              value.trim().length > 2) {
            studentName = value.trim()
          }
        })
        
        console.log(`Processing student: ${registerNumber} - ${studentName}`)
        
        // Extract subjects and grades from the row, grouped by semester per column
        const semesterToSubjects: { [sem: number]: any[] } = {}
        
        // Process each column in the row (skip first two columns which are name and reg number)
        row.forEach((grade, colIndex) => {
          // Skip first two columns (name and registration number)
          if (colIndex < 2) return
          
          if (typeof grade === 'string' && grade.trim()) {
            const gradeStr = grade.trim()
            if (gradeStr === registerNumber || gradeStr === studentName) return
            
            // Check if this looks like a grade (A, B+, A+, O, U, etc.)
            if (/^[A-Z][+-]?$/.test(gradeStr) || gradeStr === 'O' || gradeStr === 'U') {
              // Find the subject info for this column index
              const subjectInfoForColumn = subjectInfo[colIndex as keyof typeof subjectInfo]
              if (subjectInfoForColumn) {
                // Determine semester for this column from Row 1 mapping; fill blanks by nearest neighbor
                const semForThisColumn = Number(getSemesterForColumn(colIndex))
                if (!semesterToSubjects[semForThisColumn]) semesterToSubjects[semForThisColumn] = []
                semesterToSubjects[semForThisColumn].push({
                  subjectCode: subjectInfoForColumn.code,
                  subjectName: subjectInfoForColumn.name,
                  credits: subjectInfoForColumn.credits,
                  grade: gradeStr,
                  points: getGradePoints(gradeStr)
                })
                console.log(`  Subject: ${subjectInfoForColumn.code} - Grade: ${gradeStr} - Credits: ${subjectInfoForColumn.credits} - Semester: ${semForThisColumn}`)
              }
            }
          }
        })
        
        // Push one processedData entry per semester for this student
        const semestersFound = Object.keys(semesterToSubjects).map(s => parseInt(s))
        if (semestersFound.length > 0 && registerNumber) {
          semestersFound.forEach((sem) => {
            const subjectsForSem = semesterToSubjects[sem] || []
            if (subjectsForSem.length === 0) return
            const sgpa = calculateSGPA(subjectsForSem)
            const totalCredits = subjectsForSem.reduce((sum, subject) => sum + subject.credits, 0)
            processedData.push({
              registerNumber,
              semester: sem,
              subjects: subjectsForSem,
              sgpa,
              totalCredits
            })
            console.log(`  Processed ${subjectsForSem.length} subjects for ${registerNumber}, SGPA: ${sgpa}, Semester: ${sem}`)
          })
        } else {
          console.warn(`No subjects found for student ${registerNumber}`)
        }
      })

      if (processedData.length === 0) {
        const sampleColumns = Object.keys(validDataRows[0] || {}).slice(0, 10).join(', ')
        showErrorMessage(`No valid data found in Excel file. Found ${validDataRows.length} data rows but no valid subject grades. Please ensure your Excel file has:
1. A registration number column (e.g., "Reg. Number", "Register Number")
2. Subject code columns (e.g., CS3401, GE3151, etc.) with grades
3. Valid grade values in the subject columns

Sample columns found: ${sampleColumns}`)
        return
      }

      console.log('Processed data:', processedData)
      console.log('=== FINAL PROCESSED DATA SUMMARY ===')
      processedData.forEach((student, index) => {
        console.log(`Student ${index + 1}: ${student.registerNumber} - Semester: ${student.semester} (${student.subjects.length} subjects)`)
      })
      
      // Show semester distribution
      const semesterDistribution = processedData.reduce((acc: any, student: any) => {
        const sem = student.semester
        if (!acc[sem]) {
          acc[sem] = { count: 0, students: [] }
        }
        acc[sem].count++
        acc[sem].students.push(student.registerNumber)
        return acc
      }, {})
      
      console.log('=== SEMESTER DISTRIBUTION ===')
      Object.keys(semesterDistribution).forEach(sem => {
        console.log(`Semester ${sem}: ${semesterDistribution[sem].count} students - [${semesterDistribution[sem].students.join(', ')}]`)
      })
      console.log('=============================')
      console.log('=====================================')

      // Update each student's semester data
      console.log(`Processing ${processedData.length} students from Excel file`)
      console.log('Registration numbers from Excel:', processedData.map(s => s.registerNumber))
      console.log('Detailed Excel data:', JSON.stringify(processedData, null, 2))
      
      // Show summary of semesters to be updated
      const semesterSummary = processedData.reduce((acc: any, student: any) => {
        const sem = student.semester
        if (!acc[sem]) {
          acc[sem] = []
        }
        acc[sem].push(student.registerNumber)
        return acc
      }, {})
      
      console.log('Semester update summary:')
      Object.keys(semesterSummary).forEach(sem => {
        console.log(`  Semester ${sem}: ${semesterSummary[sem].length} students - [${semesterSummary[sem].join(', ')}]`)
      })
      
      // Show user-friendly semester distribution message
      const semesterCounts = Object.keys(semesterSummary).map(sem => `Semester ${sem}: ${semesterSummary[sem].length} students`).join(', ')
      console.log(`📊 Semester Distribution: ${semesterCounts}`)
      
      // Check what students exist in the database for this year and department
      try {
        const existingStudentsResponse = await api.get(`/admin/students?year=${year}&department=${department}`)
        const existingStudents = existingStudentsResponse.data
        console.log(`Found ${existingStudents.length} students in database for ${department} ${year}`)
        console.log('Existing registration numbers:', existingStudents.map((s: any) => s.registerNumber))
        
        // Check which Excel students are not in database
        const excelRegNumbers = processedData.map((s: any) => s.registerNumber)
        const dbRegNumbers = existingStudents.map((s: any) => s.registerNumber)
        const missingStudents = excelRegNumbers.filter(regNum => !dbRegNumbers.includes(regNum))
        
        if (missingStudents.length > 0) {
          console.warn(`Students from Excel not found in database: ${missingStudents.join(', ')}`)
          console.warn('These students will be skipped during upload.')
        }
        
        // Test lookup for the first few students to see what's happening
        if (processedData.length > 0) {
          console.log('Testing lookup for first student...')
          const testRegNumber = String(processedData[0].registerNumber).trim()
          try {
            const testResponse = await api.get(`/admin/students/by-register/${testRegNumber}`)
            console.log('Test lookup successful:', testResponse.data)
          } catch (testError: any) {
            console.error('Test lookup failed:', testError.response?.status, testError.response?.data)
            console.error('This indicates the student lookup endpoint is not working properly.')
          }
        }
        
        // Filter out students that don't exist in the database
        const validStudents = processedData.filter(student => 
          dbRegNumbers.includes(student.registerNumber)
        )
        
        if (validStudents.length !== processedData.length) {
          console.warn(`Filtering out ${processedData.length - validStudents.length} students that don't exist in database`)
          console.warn('Only students that exist in the database will be processed.')
        }
        
        // Update processedData to only include valid students
        processedData.length = 0
        processedData.push(...validStudents)
        
      } catch (error) {
        console.warn('Could not fetch existing students for comparison:', error)
        console.warn('Proceeding with upload but some students might not be found.')
      }
      
      const updatePromises = processedData.map(async (studentData, index) => {
        try {
          // Clean the registration number (remove whitespace, convert to string)
          const cleanRegisterNumber = String(studentData.registerNumber).trim()
          console.log(`[${index + 1}/${processedData.length}] Looking for student with registration number: "${cleanRegisterNumber}"`)
          console.log(`[${index + 1}/${processedData.length}] Original: "${studentData.registerNumber}"`)
          console.log(`[${index + 1}/${processedData.length}] Cleaned: "${cleanRegisterNumber}"`)
          console.log(`[${index + 1}/${processedData.length}] Registration number type: ${typeof cleanRegisterNumber}`)
          console.log(`[${index + 1}/${processedData.length}] Registration number length: ${cleanRegisterNumber?.length}`)
          
          const response = await api.get(`/admin/students/by-register/${cleanRegisterNumber}`)
          const student = response.data
          console.log(`[${index + 1}/${processedData.length}] Found student: ${student.name} (${student.registerNumber})`)
          console.log(`[${index + 1}/${processedData.length}] Student ID: ${student._id}`)

          if (!student.academic) {
            student.academic = { semesters: [] }
          }
          if (!student.academic.semesters) {
            student.academic.semesters = []
          }
          
          // Check existing semesters
          const existingSemesters = student.academic.semesters.map((s: any) => s.semesterNumber)
          console.log(`[${index + 1}/${processedData.length}] Existing semesters: [${existingSemesters.join(', ')}]`)
          console.log(`[${index + 1}/${processedData.length}] Trying to update semester: ${studentData.semester}`)
          
          // Log existing semesters but don't restrict updates
          if (existingSemesters.length > 0) {
            console.log(`[${index + 1}/${processedData.length}] Student has existing semesters: [${existingSemesters.join(', ')}]`)
            if (existingSemesters.includes(studentData.semester)) {
              console.log(`[${index + 1}/${processedData.length}] Will update existing semester ${studentData.semester}`)
            } else {
              console.log(`[${index + 1}/${processedData.length}] Will add new semester ${studentData.semester}`)
            }
          } else {
            console.log(`[${index + 1}/${processedData.length}] Student has no existing semesters, will add semester ${studentData.semester}`)
          }

          console.log(`Current semesters for ${student.name}:`, student.academic.semesters)
          console.log(`Adding/updating semester ${studentData.semester} with ${studentData.subjects.length} subjects`)

          // Update or add semester data
          const existingSemesterIndex = student.academic.semesters.findIndex((s: any) => s.semesterNumber === studentData.semester)
          if (existingSemesterIndex >= 0) {
            console.log(`Updating existing semester ${studentData.semester} at index ${existingSemesterIndex}`)
            student.academic.semesters[existingSemesterIndex] = {
              semesterNumber: studentData.semester,
              subjects: studentData.subjects,
              sgpa: studentData.sgpa,
              totalCredits: studentData.totalCredits
            }
          } else {
            console.log(`Adding new semester ${studentData.semester}`)
            student.academic.semesters.push({
              semesterNumber: studentData.semester,
              subjects: studentData.subjects,
              sgpa: studentData.sgpa,
              totalCredits: studentData.totalCredits
            })
          }

          // Calculate CGPA
          const newCGPA = calculateCGPA(student.academic.semesters)
          student.academic.cgpa = newCGPA
          console.log(`Updated CGPA for ${student.name}: ${newCGPA}`)

          // Update student in database using a more direct approach
          console.log(`Updating student ${student.name} in database...`)
          console.log('Student data being sent:', JSON.stringify(student, null, 2))
          
          // Use the dedicated semester update endpoint
          const semesterUpdateData = {
            semesterNumber: Number(studentData.semester),
            subjects: studentData.subjects,
            sgpa: studentData.sgpa,
            totalCredits: studentData.totalCredits
          }
          
          console.log(`[${index + 1}/${processedData.length}] Updating semester ${studentData.semester} for student ${studentData.registerNumber}`)
          console.log(`[${index + 1}/${processedData.length}] Semester update data:`, JSON.stringify(semesterUpdateData, null, 2))
          console.log(`[${index + 1}/${processedData.length}] Semester number type: ${typeof studentData.semester}`)
          console.log(`[${index + 1}/${processedData.length}] Semester number value: ${studentData.semester}`)
          
          console.log('Semester update data:', JSON.stringify(semesterUpdateData, null, 2))
          
          const updatedStudent = await api.put(`/students/${student._id}/semester`, semesterUpdateData)
          console.log(`Successfully updated student ${student.name}`)
          console.log('Updated student data:', JSON.stringify(updatedStudent.data, null, 2))
          
          // Verify the update by fetching the student again
          const verifyResponse = await api.get(`/admin/students/by-register/${studentData.registerNumber}`)
          console.log('Verification - student data after update:', JSON.stringify(verifyResponse.data, null, 2))
        } catch (error: any) {
          console.error(`[${index + 1}/${processedData.length}] Failed to update student ${studentData.registerNumber}:`, error)
          if (error.response?.status === 404) {
            console.warn(`[${index + 1}/${processedData.length}] Student with registration number ${studentData.registerNumber} not found in database`)
            console.warn(`[${index + 1}/${processedData.length}] This could be because:`)
            console.warn(`[${index + 1}/${processedData.length}] 1. Student is not registered in the system`)
            console.warn(`[${index + 1}/${processedData.length}] 2. Student registration is not approved`)
            console.warn(`[${index + 1}/${processedData.length}] 3. Registration number format mismatch`)
            console.warn(`[${index + 1}/${processedData.length}] 4. Student belongs to different department/year`)
          } else if (error.response?.status === 500) {
            console.error(`[${index + 1}/${processedData.length}] Server error updating student ${studentData.registerNumber}:`, error.response.data)
          } else if (error.response?.status === 403) {
            console.error(`[${index + 1}/${processedData.length}] Permission denied for student ${studentData.registerNumber}`)
          }
          throw error // Re-throw to be caught by Promise.allSettled
        }
      })

      const results = await Promise.allSettled(updatePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      console.log(`Upload results: ${successful} successful, ${failed} failed`)
      
      // Log details of successful updates
      const successfulResults = results.filter(r => r.status === 'fulfilled')
      if (successfulResults.length > 0) {
        console.log('Successfully updated semesters:')
        successfulResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const studentData = processedData[index]
            console.log(`  ${index + 1}. ${studentData?.registerNumber} - Semester ${studentData?.semester} (${studentData?.subjects?.length || 0} subjects)`)
          }
        })
      }
      
      // Log details of failed updates
      const failedResults = results.filter(r => r.status === 'rejected')
      if (failedResults.length > 0) {
        console.log('Failed updates:')
        failedResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.log(`  ${index + 1}. ${processedData[index]?.registerNumber}: ${result.reason?.message || 'Unknown error'}`)
          }
        })
      }
      
      setShowUploadModal(false)
      setExcelFile(null)
      setFileInputKey(prev => prev + 1) // Reset file input
      // Reset the file input
      const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
      
      // Create detailed success message with semester distribution
      const semesterDetails = Object.keys(semesterSummary).map(sem => 
        `Semester ${sem}: ${semesterSummary[sem].length} students`
      ).join(', ')
      
      if (failed > 0) {
        showSuccessMessage(`Successfully updated results for ${successful} students across multiple semesters (${semesterDetails}). ${failed} students were not found in the database.`)
      } else {
        showSuccessMessage(`Successfully updated results for ${successful} students across multiple semesters: ${semesterDetails}`)
      }
      
      // Refresh the student list to show updated data
      console.log('Upload completed, refreshing data...')
      // Instead of full page reload, we could fetch fresh data
      // For now, let's use a simple reload to ensure data is fresh
      setTimeout(() => {
        window.location.reload()
      }, 2000) // Give time for the success message to show

    } catch (error) {
      console.error('Error processing Excel file:', error)
      showErrorMessage('Failed to process Excel file')
      setExcelFile(null)
      setFileInputKey(prev => prev + 1)
      // Reset the file input
      const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      } // Reset file input on error
    } finally {
      setUploadingExcel(false)
    }
  }

  const handleCloseFilterSuccessPopup = () => {
    setShowFilterSuccessPopup(false)
  }

  const showSuccessMessage = (message: string) => {
    setPopupMessage(message)
    setShowSuccessPopup(true)
  }

  const showErrorMessage = (message: string) => {
    setPopupMessage(message)
    setShowErrorPopup(true)
  }

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false)
    setPopupMessage('')
  }

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false)
    setPopupMessage('')
  }

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    const role = localStorage.getItem('role')
    if (role === 'rep') {
      setRepSingleDeleteId(studentId)
      setStudentToDelete({ id: studentId, name: studentName })
      setShowRepSingleDeleteModal(true)
      return
    }
    // For staff and admin, no verification needed for single delete
    setStudentToDelete({ id: studentId, name: studentName })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return

    try {
      // Delete student (backend handles role-based restrictions)
      console.log('Deleting student:', studentToDelete.id)
      const deleteResponse = await api.delete(`/admin/students/${studentToDelete.id}`)
      console.log('Delete response:', deleteResponse)

      // Optimistically update UI immediately for better UX
      setRows((prev: any[]) => prev.filter((r: any) => String(r._id || r.id) !== String(studentToDelete.id)))
      showSuccessMessage(`Student ${studentToDelete.name} deleted successfully`)
      setShowDeleteModal(false)
      setStudentToDelete(null)

      // Refresh the student list in background; failure here should not flip success to error
      try {
        console.log('Refreshing student list with params:', { year, department })
        const { data } = await api.get('/admin/students', { params: { year, department } })
        console.log('Refresh response:', data)
        setRows(data)
      } catch (refreshError) {
        console.warn('Background refresh after delete failed:', refreshError)
      }
    } catch (error: any) {
      console.error('Failed to delete student:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })
      const errorMessage = error?.response?.data?.error || 'Failed to delete student'
      showErrorMessage(errorMessage)
      setShowDeleteModal(false)
      setStudentToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setStudentToDelete(null)
  }

  const addSkill = (type: 'technical' | 'soft') => {
    const skill = type === 'technical' ? tempSkill.technical : tempSkill.soft
    if (!skill.trim()) return
    
    const currentSkills = filters[type === 'technical' ? 'technicalSkills' : 'softSkills']
    if (!currentSkills.includes(skill.trim())) {
      setFilters({
        ...filters,
        [type === 'technical' ? 'technicalSkills' : 'softSkills']: [...currentSkills, skill.trim()]
      })
    }
    
    setTempSkill({ ...tempSkill, [type]: '' })
  }

  const removeSkill = (type: 'technical' | 'soft', index: number) => {
    const currentSkills = filters[type === 'technical' ? 'technicalSkills' : 'softSkills']
    setFilters({
      ...filters,
      [type === 'technical' ? 'technicalSkills' : 'softSkills']: currentSkills.filter((_, i) => i !== index)
    })
  }

  const applyFilters = async () => {
    try {
      // Build filter parameters, only include non-empty values
      const filterParams: any = {
        year,
        department
      }
      
      // Only add filters that have values
      if (filters.willingToPlace.length > 0) filterParams.willingToPlace = filters.willingToPlace.join(',')
      if (filters.historyOfArrears.length > 0) filterParams.historyOfArrears = filters.historyOfArrears.join(',')
      if (filters.currentArrears.length > 0) filterParams.currentArrears = filters.currentArrears.join(',')
      if (filters.cgpaRange) filterParams.cgpaRange = filters.cgpaRange
      if (filters.gender) filterParams.gender = filters.gender
      if (filters.technicalSkills.length > 0) filterParams.technicalSkills = filters.technicalSkills.join(',')
      if (filters.softSkills.length > 0) filterParams.softSkills = filters.softSkills.join(',')
      if (filters.hscPercentage) filterParams.hscPercentage = filters.hscPercentage
      if (filters.sslcPercentage) filterParams.sslcPercentage = filters.sslcPercentage
      if (filters.hasInternship.length > 0) filterParams.hasInternship = filters.hasInternship.join(',')
      if (filters.hasProjects.length > 0) filterParams.hasProjects = filters.hasProjects.join(',')
      if (filters.hasCertifications.length > 0) filterParams.hasCertifications = filters.hasCertifications.join(',')
      
      console.log('Applying filters with params:', filterParams)
      
      const { data } = await api.get('/admin/students/filter', { params: filterParams })
      console.log('Filter results:', data)
      
      setFilteredRows(data)
      setIsFiltered(true)
      setShowFilterModal(false)
      setShowFilterSuccessPopup(true)
      
      // Clear search query when applying filters
      setQuery('')
    } catch (error) {
      console.error('Failed to apply filters:', error)
      showErrorMessage('Failed to apply filters')
    }
  }

  const clearFilters = () => {
    setFilters({
      willingToPlace: [],
      historyOfArrears: [],
      currentArrears: [],
      cgpaRange: '',
      technicalSkills: [],
      softSkills: [],
      gender: '',
      year: '',
      department: '',
      hscPercentage: '',
      sslcPercentage: '',
      hasInternship: [],
      hasProjects: [],
      hasCertifications: []
    })
    setFilteredRows([])
    setIsFiltered(false)
    setQuery('')
    setShowFilterModal(false)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allStudentIds = new Set(searchFilteredRows.map(s => s._id))
      setSelectedStudents(allStudentIds)
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true)
    setSelectedStudents(new Set())
  }

  const handleExitDeleteMode = () => {
    setIsDeleteMode(false)
    setSelectedStudents(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return
    const role = localStorage.getItem('role')
    if (role === 'staff') {
      // Staff admin needs verification for bulk delete
      setShowBulkDeleteModal(false)
      setShowAdminVerificationModal(true)
    } else {
      // Main admin can delete directly
      setShowBulkDeleteModal(true)
    }
  }

  const confirmBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setShowAdminVerificationModal(true)
  }

  const verifyAdminAndDelete = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      showErrorMessage('Please enter both username and password')
      return
    }

    setIsDeleting(true)
    try {
      // Verify admin credentials (works for both admin and staff)
      const verifyResponse = await api.post('/admin/verify', {
        username: adminCredentials.username,
        password: adminCredentials.password
      })

      if (!verifyResponse.data.valid) {
        showErrorMessage('Invalid credentials')
        setIsDeleting(false)
        return
      }

      // If verification successful, proceed with bulk delete
      const studentIds = Array.from(selectedStudents)
      await api.post('/admin/students/bulk-delete', {
        studentIds,
        year,
        department
      })

      // Refresh the student list
      const { data } = await api.get('/admin/students', { params: { year, department } })
      const sortedData = data.sort((a: any, b: any) => {
        return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })
      })
      setRows(sortedData)
      setSelectedStudents(new Set())
      setIsDeleteMode(false)
      showSuccessMessage(`Successfully deleted ${studentIds.length} student(s)`)
      setShowAdminVerificationModal(false)
      setAdminCredentials({ username: '', password: '' })
    } catch (error) {
      console.error('Failed to delete students:', error)
      showErrorMessage('Failed to delete students. Please check credentials and try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setShowAdminVerificationModal(false)
    setAdminCredentials({ username: '', password: '' })
    setIsDeleteMode(false)
    setSelectedStudents(new Set())
  }


  useEffect(() => {
    (async () => {
      if (!year || !department) {
        console.log('Missing required parameters:', { year, department })
        setRows([])
        return
      }
      
      try {
        console.log('Fetching students with params:', { year, department })
        const { data } = await api.get('/students', { params: { year, department } })
        console.log('Students data received:', data)
        // Debug: Log first student's profile photo data
        if (data.length > 0) {
          console.log('First student profile data:', {
            name: data[0].name,
            profilePhoto: data[0].profilePhoto,
            allFields: Object.keys(data[0])
          })
        }
        // Sort students by register number
        const sortedData = data.sort((a: any, b: any) => {
          return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })
        })
        setRows(sortedData)
        // Load current representative info
        try {
          const r = await api.get('/admin/reps', { params: { department, year } })
          const list = Array.isArray(r.data) ? r.data.map((x:any)=>({ username: x.username, name: x.name, email: x.email, department: x.department, year: x.year })) : []
          setRepList(list)
        } catch { setRepList([]) }
      } catch (error) {
        console.error('Failed to fetch students:', error)
        setRows([])
      }
    })()
  }, [year, department])

  async function fetchStaffAdmins() {
    try {
      const { data } = await api.get('/admin/staff')
      setStaffList(data || [])
    } catch (e) {
      console.error('Failed to load staff admins', e)
    }
  }

  async function handleCreateStaff() {
    // Require admin credential verification first
    setVerifyPurpose('create_staff')
    setShowVerifyModal(true)
  }

  async function performCreateStaff() {
    try {
      const payload = {
        username: staffCreateForm.username.trim(),
        password: staffCreateForm.password,
        name: staffCreateForm.name.trim() || undefined,
        email: staffCreateForm.email.trim() || undefined,
        department: staffCreateForm.department || department,
      }
      await api.post('/admin/staff', payload)
      setShowStaffCreateModal(false)
      setStaffCreateForm({ username: '', password: '', name: '', email: '', department: department || '' })
      fetchStaffAdmins()
    } catch (e) {
      console.error('Create staff failed', e)
      alert('Failed to create staff admin. Please check inputs and try again.')
    }
  }

  async function verifyAdminCredentials() {
    try {
      const { data } = await api.post('/admin/verify', { username: verifyForm.username, password: verifyForm.password })
      if (data?.valid) {
        setShowVerifyModal(false)
        if (verifyPurpose === 'create_staff') {
          await performCreateStaff()
        } else if (verifyPurpose === 'delete_staff' && verifyTargetUsername) {
          await api.delete(`/admin/staff/${verifyTargetUsername}`)
          await fetchStaffAdmins()
        }
        setVerifyPurpose(null)
        setVerifyTargetUsername('')
        setVerifyForm({ username: '', password: '' })
      } else {
        alert('Invalid admin credentials')
      }
    } catch (e) {
      console.error('Verify admin failed', e)
      alert('Verification failed. Try again.')
    }
  }

  const normalized = (v: string) => (v || '').toString().toLowerCase().trim()
  const qNorm = normalized(query)
  
  // Use filtered results if filters are applied, otherwise use original rows
  const dataToSearch = isFiltered ? filteredRows : rows
  const searchFilteredRows = qNorm
    ? dataToSearch.filter(s => {
        const name = normalized(s.name)
        const reg = normalized(s.registerNumber)
        return name.includes(qNorm) || reg.includes(qNorm)
      })
    : dataToSearch

  return (
    <>
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="w-full max-w-7xl mx-auto overflow-x-hidden px-2 sm:px-6 py-4 sm:py-6">
      {/* Header Section */}
      <div className="mb-6">
        <nav className="text-xs sm:text-sm text-neutral-400 mb-2 flex flex-wrap items-center gap-1">
          <Link to="/admin/departments" className="hover:text-white whitespace-nowrap">Dashboard</Link>
          <span className="text-neutral-500">›</span>
          <Link to={`/admin/departments?department=${encodeURIComponent(department)}`} className="hover:text-white whitespace-nowrap">{department} Department</Link>
          <span className="text-neutral-500">›</span>
          <Link to={`/admin/departments?department=${encodeURIComponent(department)}`} className="hover:text-white whitespace-nowrap">{year} Year</Link>
        </nav>

        {/* Mobile: Back and Logout buttons at the top */}
        <div className="sm:hidden mb-4">
          <div className="flex gap-3 w-full">
            {localStorage.getItem('role') !== 'rep' && !showLogoutPopup && (
              <button 
                onClick={() => navigate(`/admin/departments?department=${encodeURIComponent(department)}`)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-sm rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
              >
                ← Back
              </button>
            )}
            <button 
              onClick={handleLogout}
              className={`${localStorage.getItem('role') === 'rep' ? 'w-auto' : 'flex-1'} inline-flex items-center justify-center px-3 py-2.5 text-sm rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-white/10 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Inject custom CSS for slice button, upload button, and scrollbar */}
        <style>{`
          /* Custom scrollbar for upload modal */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #2a2a2a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #777;
          }
          /* Download button style - improved with better colors */
          .download-button { 
            --c1:#0b0b0b; 
            --c2:#3b82f6; 
            --size-letter:13px; 
            padding:0.625rem 0.8em; 
            font-size:var(--size-letter); 
            background:linear-gradient(180deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05)); 
            border:1px solid var(--c2); 
            border-radius:0.375rem; 
            cursor:pointer; 
            overflow:hidden; 
            position:relative; 
            transition:300ms cubic-bezier(0.83,0,0.17,1); 
            box-shadow:0 6px 18px rgba(59,130,246,0.15), inset 0 0 0 1px rgba(59,130,246,0.25); 
            line-height:1; 
          }
          @media (min-width:640px){ .download-button{ --size-letter:14px; padding:0.4em 0.95em; } }
          .download-button > .text { 
            font-weight:400; 
            color:var(--c2); 
            position:relative; 
            z-index:1; 
            transition:color 700ms cubic-bezier(0.83,0,0.17,1); 
            letter-spacing:.3px; 
            display:inline-flex; 
            align-items:center; 
            gap:.4em; 
          }
          .download-button::before { 
            content:""; 
            position:absolute; 
            inset:0; 
            border-radius:0.375rem; 
            box-shadow:0 0 24px rgba(59,130,246,0.25), 0 0 48px rgba(59,130,246,0.2); 
            opacity:.25; 
            transition:opacity .3s ease; 
          }
          .download-button::after { 
            content:""; 
            width:0; 
            height:calc(300% + 1em); 
            position:absolute; 
            transform:translate(-50%,-50%) rotate(30deg); 
            inset:50%; 
            background:linear-gradient(180deg, #3b82f6, #1d4ed8); 
            transition:1000ms cubic-bezier(0.83,0,0.17,1); 
            box-shadow:0 0 16px rgba(59,130,246,0.65); 
          }
          .download-button:hover { 
            box-shadow:0 8px 22px rgba(59,130,246,0.22), inset 0 0 0 1px rgba(255,255,255,0.08); 
            border-color:#60a5fa; 
          }
          .download-button:hover > .text { color:#ffffff; }
          .download-button:hover::before { opacity:.45; }
          .download-button:hover::after { width:calc(120% + 1em); }
          .download-button:active { transform:scale(0.98); filter:brightness(0.95); }
          .download-button .icon { width:16px; height:16px; stroke:currentColor; }
          
          /* Custom upload button style */
          .upload-button {
            --color: rgba(147, 51, 234, 1);
            padding: 0.625rem 0.8em;
            background-color: transparent;
            border-radius: .3em;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: .5s;
            font-weight: 400;
            font-size: 13px;
            border: 1px solid;
            font-family: inherit;
            text-transform: uppercase;
            color: var(--color);
            z-index: 1;
          }
          
          @media (min-width:640px){ 
            .upload-button{ 
              font-size: 14px; 
              padding: 0.4em 0.95em; 
            } 
          }
          
          .upload-button::before, .upload-button::after {
            content: '';
            display: block;
            width: 50px;
            height: 50px;
            transform: translate(-50%, -50%);
            position: absolute;
            border-radius: 50%;
            z-index: -1;
            background-color: var(--color);
            transition: 1s ease;
          }
          
          .upload-button::before {
            top: -1em;
            left: -1em;
          }
          
          .upload-button::after {
            left: calc(100% + 1em);
            top: calc(100% + 1em);
          }
          
          .upload-button:hover::before, .upload-button:hover::after {
            height: 410px;
            width: 410px;
          }
          
          .upload-button:hover {
            color: #fff;
          }
          
          .upload-button:active {
            filter: brightness(.8);
          }
          
          /* Custom button styles for Edit, View and Delete */
          .edit-button {
            --color: rgba(59, 130, 246, 1);
            padding: 0.4em 0.8em;
            background-color: transparent;
            border-radius: .3em;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: .5s;
            font-weight: 500;
            font-size: 12px;
            border: 1px solid;
            font-family: inherit;
            text-transform: uppercase;
            color: var(--color);
            z-index: 1;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            min-width: 50px;
          }
          
          .edit-button::before, .edit-button::after {
            content: '';
            display: block;
            width: 30px;
            height: 30px;
            transform: translate(-50%, -50%);
            position: absolute;
            border-radius: 50%;
            z-index: -1;
            background-color: var(--color);
            transition: 1s ease;
          }
          
          .edit-button::before {
            top: -1em;
            left: -1em;
          }
          
          .edit-button::after {
            left: calc(100% + 1em);
            top: calc(100% + 1em);
          }
          
          .edit-button:hover::before, .edit-button:hover::after {
            height: 200px;
            width: 200px;
          }
          
          .edit-button:hover {
            color: #fff;
            text-decoration: none;
          }
          
          .edit-button:active {
            filter: brightness(.8);
          }
          
          .view-button {
            --color: rgba(59, 130, 246, 1);
            padding: 0.4em 0.8em;
            background-color: transparent;
            border-radius: .3em;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: .5s;
            font-weight: 500;
            font-size: 12px;
            border: 1px solid;
            font-family: inherit;
            text-transform: uppercase;
            color: var(--color);
            z-index: 1;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            min-width: 50px;
          }
          
          .view-button::before, .view-button::after {
            content: '';
            display: block;
            width: 30px;
            height: 30px;
            transform: translate(-50%, -50%);
            position: absolute;
            border-radius: 50%;
            z-index: -1;
            background-color: var(--color);
            transition: 1s ease;
          }
          
          .view-button::before {
            top: -1em;
            left: -1em;
          }
          
          .view-button::after {
            left: calc(100% + 1em);
            top: calc(100% + 1em);
          }
          
          .view-button:hover::before, .view-button:hover::after {
            height: 200px;
            width: 200px;
          }
          
          .view-button:hover {
            color: #fff;
            text-decoration: none;
          }
          
          .view-button:active {
            filter: brightness(.8);
          }
          
          .delete-button {
            --color: rgba(239, 68, 68, 1);
            padding: 0.4em 0.8em;
            background-color: transparent;
            border-radius: .3em;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: .5s;
            font-weight: 500;
            font-size: 12px;
            border: 1px solid;
            font-family: inherit;
            text-transform: uppercase;
            color: var(--color);
            z-index: 1;
            display: inline-block;
            text-align: center;
            min-width: 50px;
          }
          
          .delete-button::before, .delete-button::after {
            content: '';
            display: block;
            width: 30px;
            height: 30px;
            transform: translate(-50%, -50%);
            position: absolute;
            border-radius: 50%;
            z-index: -1;
            background-color: var(--color);
            transition: 1s ease;
          }
          
          .delete-button::before {
            top: -1em;
            left: -1em;
          }
          
          .delete-button::after {
            left: calc(100% + 1em);
            top: calc(100% + 1em);
          }
          
          .delete-button:hover::before, .delete-button:hover::after {
            height: 200px;
            width: 200px;
          }
          
          .delete-button:hover {
            color: #fff;
          }
          
          .delete-button:active {
            filter: brightness(.8);
          }
        `}</style>

        {/* Heading + Actions row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">{year} Year Students</h1>
            <p className="text-neutral-400 text-base sm:text-lg font-medium">{department} Department</p>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">{filteredRows.length} of {rows.length} student{rows.length !== 1 ? 's' : ''}</p>
          </div>
          {/* Mobile: Two rows, Desktop: Single row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            
            {/* Second row on mobile: Download + Upload */}
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={async ()=>{
                  try {
                    const params: any = { year, department };
                    if (isFiltered) {
                      if (filters.willingToPlace.length > 0) params.willingToPlace = filters.willingToPlace.join(',');
                      if (filters.historyOfArrears.length > 0) params.historyOfArrears = filters.historyOfArrears.join(',');
                      if (filters.currentArrears.length > 0) params.currentArrears = filters.currentArrears.join(',');
                      if (filters.cgpaRange) params.cgpaRange = filters.cgpaRange;
                      if (filters.gender) params.gender = filters.gender;
                      if (filters.technicalSkills.length > 0) params.technicalSkills = filters.technicalSkills.join(',');
                      if (filters.softSkills.length > 0) params.softSkills = filters.softSkills.join(',');
                      if (filters.hscPercentage) params.hscPercentage = filters.hscPercentage;
                      if (filters.sslcPercentage) params.sslcPercentage = filters.sslcPercentage;
                      if (filters.hasInternship.length > 0) params.hasInternship = filters.hasInternship.join(',');
                      if (filters.hasProjects.length > 0) params.hasProjects = filters.hasProjects.join(',');
                      if (filters.hasCertifications.length > 0) params.hasCertifications = filters.hasCertifications.join(',');
                    }
                    const queryString = new URLSearchParams(params).toString();
                    const url = `/admin/students/export?${queryString}`;
                    const res = await api.get(url, { responseType: 'blob' });
                    const blobUrl = window.URL.createObjectURL(res.data as any);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `students_${department || 'all'}_${year || 'all'}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (e) {
                    showErrorMessage('Failed to download');
                  }
                }}
                className="download-button flex-1 sm:flex-none py-2.5 sm:py-2 flex items-center justify-center gap-2"
                title="Download students (CSV)"
              >
                <span className="text">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>
                  <span className="hidden xs:inline">Download CSV</span>
                  <span className="xs:hidden">Download</span>
                </span>
              </button>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="upload-button flex-1 sm:flex-none whitespace-nowrap py-2.5 sm:py-2 flex items-center justify-center gap-2"
                title="Upload semester results from Excel file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Results</span>
              </button>
            </div>
            
            {/* Desktop: Back and Logout buttons at the end */}
            <div className="hidden sm:flex gap-3">
              {localStorage.getItem('role') !== 'rep' && !showLogoutPopup && (
                <button 
                  onClick={() => navigate(`/admin/departments?department=${encodeURIComponent(department)}`)}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 hover:text-sky-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
                >
                  ← Back
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-4 py-2 text-sm sm:text-base rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-white/10 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111] whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>


        {/* Search and Filter */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#93c5fd" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span className="font-semibold text-neutral-200">Search Students</span>
          </div>
          
          {/* Search Input - Full Width on Mobile */}
          <div className="mb-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#9ca3af" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or reg. no (e.g., 710022104002 or Nithishwaran)"
                aria-label="Search students by name or register number"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-400 placeholder:text-xs sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
              />
            </div>
          </div>

          {/* Action Buttons - Single Row Layout */}
          <div className="flex flex-wrap gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-purple-700 text-purple-200 bg-transparent hover:bg-purple-900/30 hover:text-purple-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#111]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              Filter
            </button>
            
            
            {/* Clear Button */}
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-red-700 text-red-200 bg-transparent hover:bg-red-900/30 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
            
            {/* Delete Mode Buttons */}
            {!isDeleteMode ? (
              (localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'staff') && (
                <button
                  onClick={handleEnterDeleteMode}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-red-700 text-red-200 bg-transparent hover:bg-red-900/30 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                  Delete Students
                </button>
              )
            ) : (
              <div className="flex gap-2">
                {selectedStudents.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-red-700 text-red-200 bg-red-900/20 hover:bg-red-900/40 hover:text-red-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#111]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    </svg>
                    <span className="hidden xs:inline">Delete Selected ({selectedStudents.size})</span>
                    <span className="xs:hidden">Delete ({selectedStudents.size})</span>
                  </button>
                )}
                <button
                  onClick={handleExitDeleteMode}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-gray-700 text-gray-200 bg-transparent hover:bg-gray-900/30 hover:text-gray-100 shadow-sm active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#111]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      

      {/* Delete Mode Message - Above Table */}
      {isDeleteMode && (
        <div className="mb-4 p-3 rounded-lg border border-blue-800 bg-blue-900/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-300">Select students to delete</span>
          </div>
        </div>
      )}

      {/* Student List Title */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Student List</h2>
        <p className="text-sm text-neutral-400">Manage and view student information</p>
      </div>

      <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden mb-6">
        {/* Desktop Table Header */}
        <div className={`hidden sm:grid p-4 border-b border-neutral-800 text-sm font-medium text-neutral-300 bg-neutral-800 ${isDeleteMode ? 'grid-cols-5' : 'grid-cols-4'} gap-4`}>
          <div>Profile</div>
          <div>Register Number</div>
          <div>Student Name</div>
          <div className="text-right whitespace-nowrap pr-2 min-w-[116px]">Actions</div>
          {isDeleteMode && (
            <div className="flex items-center justify-center gap-2 min-w-[80px]">
              <input
                type="checkbox"
                checked={selectedStudents.size > 0 && selectedStudents.size === searchFilteredRows.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-xs">Select All</span>
            </div>
          )}
        </div>

        {/* Mobile Delete Mode Header */}
        {isDeleteMode && (
          <div className="sm:hidden p-3 border-b border-neutral-800 bg-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.size > 0 && selectedStudents.size === searchFilteredRows.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-neutral-300">Select All</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-400">
                  {selectedStudents.size}/{searchFilteredRows.length}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {searchFilteredRows.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-neutral-400">
            <div className="text-base sm:text-lg mb-2">No students found</div>
            <div className="text-xs sm:text-sm">Try clearing the search or check different filters</div>
          </div>
        ) : (
          searchFilteredRows.map((s, index) => (
            <div key={s._id}>
              {/* Desktop Layout */}
              <div className={`hidden sm:grid p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 ${isDeleteMode ? 'grid-cols-5' : 'grid-cols-4'} gap-4`}>
                <div className="flex items-center">
                  <img 
                    src={s.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=1e293b&color=ffffff&size=40`} 
                    alt="Profile" 
                    className="w-10 h-10 rounded object-cover border-2 border-sky-500"
                    onError={(e) => {
                      console.log('Profile image failed to load for:', s.name, 'URL:', e.currentTarget.src);
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=1e293b&color=ffffff&size=40`;
                    }}
                    onLoad={() => console.log('Profile image loaded for:', s.name, 'URL:', s.profilePhoto || s.profileImage || s.photo || s.avatar)}
                    loading="lazy"
                  />
                </div>
                <Link 
                  to={`/admin/students/${s._id}`}
                  className="font-mono text-sky-400 text-base hover:text-sky-300 flex items-center"
                >
                  {s.registerNumber}
                </Link>
                <Link 
                  to={`/admin/students/${s._id}`}
                  className="text-white text-base hover:text-neutral-300 flex items-center"
                >
                  {s.name}
                </Link>
                <div className="flex items-center justify-end gap-3 min-w-[116px]">
                  <Link
                    to={`/admin/students/${s._id}`}
                    className="view-button"
                  >
                    View
                  </Link>
                  {!isDeleteMode && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteStudent(s._id, s.name)
                      }}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {isDeleteMode && (
                  <div className="flex items-center justify-center pl-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s._id)}
                      onChange={(e) => handleSelectStudent(s._id, e.target.checked)}
                      className="rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                    />
                  </div>
                )}
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden p-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0">
                <div className="space-y-2">
                  {/* Student Info */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img 
                        src={s.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=1e293b&color=ffffff&size=40`} 
                        alt="Profile" 
                        className="w-10 h-10 rounded object-cover border-2 border-sky-500 flex-shrink-0"
                        onError={(e) => {
                          console.log('Profile image failed to load for:', s.name, 'Original URL:', s.profilePhoto, 'Failed URL:', e.currentTarget.src);
                          // Try different fallback approaches
                          if (e.currentTarget.src.includes('ui-avatars.com')) {
                            e.currentTarget.src = 'https://via.placeholder.com/40x40/1e293b/ffffff?text=' + encodeURIComponent((s.name || 'Student').charAt(0).toUpperCase());
                          } else {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=1e293b&color=ffffff&size=40`;
                          }
                        }}
                        onLoad={() => console.log('Profile image loaded for:', s.name, 'URL:', s.profilePhoto)}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/admin/students/${s._id}`}
                          className="font-mono text-sky-400 text-sm hover:text-sky-300 block mb-1"
                        >
                          {s.registerNumber}
                        </Link>
                        <Link 
                          to={`/admin/students/${s._id}`}
                          className="text-white text-sm font-medium hover:text-neutral-300 block truncate"
                        >
                          {s.name}
                        </Link>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isDeleteMode ? (
                        <div className="flex gap-1">
                          <Link
                            to={`/admin/students/${s._id}`}
                            className="view-button"
                          >
                            View
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteStudent(s._id, s.name)
                            }}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/students/${s._id}`}
                            className="view-button"
                          >
                            View
                          </Link>
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(s._id)}
                              onChange={(e) => handleSelectStudent(s._id, e.target.checked)}
                              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-xs text-neutral-400">Select</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Line separator between students (except for the last one) */}
              {index < searchFilteredRows.length - 1 && (
                <div className="border-b border-neutral-700"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Placement Representatives - bottom of page (admins and staff) */}
      {(localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'staff') && (
      <div className="mt-8 mb-4 rounded-lg border border-neutral-800 overflow-hidden">
        <div className="px-4 pt-3 pb-2 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-white">Placement Representatives</h2>
            {/* Desktop buttons (unchanged sizes) */}
            <div className="hidden sm:flex items-center gap-2">
              {localStorage.getItem('role') === 'admin' && (
                <>
                  <button onClick={() => { setShowStaffModal(true); fetchStaffAdmins(); }} className="px-2 py-1 text-xs sm:text-sm rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30 whitespace-nowrap">View Staff Admins</button>
                  <button onClick={() => setShowStaffCreateModal(true)} className="px-2 py-1 text-xs sm:text-sm rounded-md border border-indigo-700 text-indigo-200 bg-transparent hover:bg-indigo-900/30 whitespace-nowrap">+ Add Staff</button>
                </>
              )}
              <button onClick={() => setShowRepModal(true)} className="px-2 py-1 text-xs sm:text-sm rounded-md border border-emerald-700 text-emerald-200 bg-transparent hover:bg-emerald-900/30 whitespace-nowrap">+ Add Rep</button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">Manage reps for this department and year</p>
          {/* Mobile buttons below subtitle */}
          <div className="mt-2 grid grid-cols-3 gap-2 sm:hidden">
            {localStorage.getItem('role') === 'admin' && (
              <>
                <button onClick={() => { setShowStaffModal(true); fetchStaffAdmins(); }} className="px-2 py-2 text-[11px] rounded-md border border-sky-700 text-sky-200 bg-transparent hover:bg-sky-900/30">View Staff</button>
                <button onClick={() => setShowStaffCreateModal(true)} className="px-2 py-2 text-[11px] rounded-md border border-indigo-700 text-indigo-200 bg-transparent hover:bg-indigo-900/30">Add Staff</button>
              </>
            )}
            <button onClick={() => setShowRepModal(true)} className="px-2 py-2 text-[11px] rounded-md border border-emerald-700 text-emerald-200 bg-transparent hover:bg-emerald-900/30">Add Rep</button>
          </div>
        </div>
        <div className="px-4 py-2 bg-neutral-800 text-sm font-medium text-emerald-300">Placement Reps List</div>
        {repList.length === 0 ? (
          <div className="p-4 text-neutral-300 text-sm">None assigned</div>
        ) : (
          <>
            {/* Desktop Table Header for Reps */}
            <div className="hidden sm:grid sm:grid-cols-5 p-3 border-b border-neutral-800 text-xs font-medium text-neutral-300 bg-neutral-800">
              <div>Username</div>
              <div>Name</div>
              <div>Department</div>
              <div>Year</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="space-y-2">
            {repList.map(r => (
              <div key={r.username} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                {/* Mobile Row - Clickable */}
                <div 
                  className="sm:hidden p-4 cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setExpandedRep(expandedRep === r.username ? null : r.username)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-neutral-400 text-xs">Username:</span>
                        <span className="font-mono text-sky-300 text-sm">{r.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 text-xs">Name:</span>
                        <span className="text-white text-sm font-medium">{r.name || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg 
                        className={`w-5 h-5 text-neutral-400 transition-transform ${expandedRep === r.username ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mobile Dropdown Details */}
                {expandedRep === r.username && (
                  <div className="sm:hidden border-t border-neutral-800 p-4 bg-neutral-800/50">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">Email</div>
                        <div className="text-neutral-200 break-all">{r.email || '-'}</div>
                      </div>
                      <div className="flex gap-2 pt-2 justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRep(r)
                            setRepEditForm({ username: r.username, name: r.name || '', email: r.email || '', password: '' })
                            setShowRepEditModal(true)
                          }} 
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setRepToDelete(r.username)
                            setShowRepDeleteModal(true)
                          }} 
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop Row - Clickable with dropdown */}
                <div 
                  className="hidden sm:block cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setExpandedRep(expandedRep === r.username ? null : r.username)}
                >
                  <div className="grid sm:grid-cols-5 p-3">
                    <div className="font-mono text-sky-300 text-sm font-semibold">{r.username}</div>
                    <div className="text-white text-sm font-medium">{r.name || '-'}</div>
                    <div className="text-neutral-300 text-sm">{r.department}</div>
                    <div className="text-neutral-300 text-sm">{r.year}</div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                          <svg 
                            className={`w-3 h-3 text-sky-400 transition-transform duration-200 ${expandedRep === r.username ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Dropdown Details */}
                {expandedRep === r.username && (
                  <div className="hidden sm:block border-t border-neutral-800 p-4 bg-neutral-800/50">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">Email</div>
                        <div className="text-neutral-200 break-all">{r.email || '-'}</div>
                      </div>
                      <div className="flex gap-2 pt-2 justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRep(r)
                            setRepEditForm({ username: r.username, name: r.name || '', email: r.email || '', password: '' })
                            setShowRepEditModal(true)
                          }} 
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setRepToDelete(r.username)
                            setShowRepDeleteModal(true)
                          }} 
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))}
            </div>
          </>
        )}
      </div>
      )}

      {/* Staff Admins Modal - visible for main admin only */}
      {showStaffModal && localStorage.getItem('role') === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowStaffModal(false)}></div>
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-6xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-white text-base sm:text-lg font-semibold">Staff Admins</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-neutral-300 hover:text-white">✕</button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {staffList.length === 0 ? (
                <div className="text-neutral-300 text-sm">No staff admins found</div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-4 p-2 text-xs text-neutral-300 border-b border-neutral-800">
                    <div>Username</div>
                    <div>Name</div>
                    <div>Email</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {staffList.map((st) => (
                    <div key={st.username} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-3 bg-neutral-800/50 rounded border border-neutral-800">
                      <div className="font-mono text-sky-300 text-sm">{st.username}</div>
                      <div className="text-white text-sm">{st.name || '-'}</div>
                      <div className="text-neutral-300 text-sm break-all min-w-0">{st.email || '-'}</div>
                      <div className="sm:text-right">
                        <button
                          onClick={async () => {
                            setVerifyPurpose('delete_staff')
                            setVerifyTargetUsername(st.username)
                            setShowVerifyModal(true)
                          }}
                          className="delete-button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-neutral-800 text-right">
              <button onClick={() => setShowStaffModal(false)} className="view-button">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Modal (admin only) */}
      {showStaffCreateModal && localStorage.getItem('role') === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowStaffCreateModal(false)}></div>
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-white text-base sm:text-lg font-semibold">Add Staff Admin</h3>
              <button onClick={() => setShowStaffCreateModal(false)} className="text-neutral-300 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Username</label>
                <input value={staffCreateForm.username} onChange={e=>setStaffCreateForm({...staffCreateForm, username:e.target.value})} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <PasswordInput value={staffCreateForm.password} onValueChange={(v)=>setStaffCreateForm({...staffCreateForm, password:v})} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Name (optional)</label>
                  <input value={staffCreateForm.name} onChange={e=>setStaffCreateForm({...staffCreateForm, name:e.target.value})} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email (optional)</label>
                  <input type="email" value={staffCreateForm.email} onChange={e=>setStaffCreateForm({...staffCreateForm, email:e.target.value})} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Department</label>
                <input value={staffCreateForm.department} readOnly className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white opacity-80" />
                <div className="text-[11px] text-neutral-400 mt-1">Auto-selected from current page. Staff will be scoped to this department.</div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button onClick={() => setShowStaffCreateModal(false)} className="px-3 py-2 rounded-md border border-neutral-700 text-neutral-200">Cancel</button>
              <button onClick={handleCreateStaff} className="px-3 py-2 rounded-md border border-indigo-700 text-indigo-200 hover:bg-indigo-900/30">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (admin) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Confirm Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{studentToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rep Single Delete Verification Modal */}
      {showRepSingleDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Verify to Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Please enter your representative credentials to delete <span className="font-semibold text-white">{studentToDelete?.name}</span>.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username</label>
                <input value={adminCredentials.username} onChange={(e)=>setAdminCredentials({...adminCredentials, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Password</label>
                <PasswordInput value={adminCredentials.password} onChange={(e)=>setAdminCredentials({...adminCredentials, password: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={()=>{ setShowRepSingleDeleteModal(false); setAdminCredentials({ username:'', password:'' }); setRepSingleDeleteId(null) }} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1">Cancel</button>
              <button onClick={async ()=>{
                try {
                  const verify = await api.post('/admin/verify', adminCredentials)
                  if (!verify.data.valid) { showErrorMessage('Invalid credentials'); return }
                  if (repSingleDeleteId) {
                    await api.delete(`/admin/students/${repSingleDeleteId}`)
                  }
                  const { data } = await api.get('/admin/students', { params: { year, department } })
                  const sortedData = data.sort((a: any, b: any) => a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true }))
                  setRows(sortedData)
                  setShowRepSingleDeleteModal(false)
                  setAdminCredentials({ username:'', password:'' })
                  setRepSingleDeleteId(null)
                  showSuccessMessage('Student deleted successfully')
                } catch (e:any) {
                  showErrorMessage(e?.response?.data?.error || 'Failed to delete student')
                }
              }} className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2">Delete</button>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
      <Footer />
      <LogoutSuccessPopup show={showLogoutPopup} onClose={handleCloseLogoutPopup} />
      <FilterSuccessPopup show={showFilterSuccessPopup} onClose={handleCloseFilterSuccessPopup} />
      <SuccessPopup show={showSuccessPopup} onClose={handleCloseSuccessPopup} message={popupMessage} />
      <ErrorPopup show={showErrorPopup} onClose={handleCloseErrorPopup} message={popupMessage} />
      
      {/* Upload Results Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Upload Semester Results</h3>
                <p className="text-sm text-neutral-400">Upload Excel file with student results</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Choose Excel File</label>
                <div className="relative">
                    <input
                    key={fileInputKey}
                      type="file"
                      accept=".xlsx,.xls"
                    onChange={(e) => {
                      console.log('File input onChange triggered')
                      const file = e.target.files?.[0] || null
                      console.log('Selected file:', file)
                      setExcelFile(file)
                      if (file) {
                        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
                      }
                    }}
                    onClick={(e) => {
                      console.log('File input clicked')
                    }}
                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-20"
                      id="excel-file-input"
                    />
                  <div 
                    className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer relative"
                    onClick={(e) => {
                      console.log('Upload area clicked')
                      e.preventDefault()
                      e.stopPropagation()
                      const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
                      if (fileInput) {
                        console.log('Triggering file input click')
                        fileInput.click()
                      }
                    }}
                  >
                    {excelFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          {/* Excel File Icon */}
                          <div className="relative">
                            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              <path d="M8,12H16V14H8V12M8,16H16V18H8V16M8,8H10V10H8V8" fill="#1d4ed8"/>
                            </svg>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                          </div>
                          <div className="text-center">
                            <span className="text-green-400 font-medium text-sm">Excel File Selected</span>
                            <p className="text-xs text-neutral-400 mt-1">Click to change file</p>
                          </div>
                        </div>
                        <div 
                          className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-600 relative z-20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                              <span className="text-sm text-neutral-300 truncate">{excelFile.name}</span>
                        </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setExcelFile(null)
                                setFileInputKey(prev => prev + 1)
                                // Reset the file input
                                const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
                                if (fileInput) {
                                  fileInput.value = ''
                                }
                              }}
                              className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors relative z-30"
                              title="Remove file"
                              type="button"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col items-center gap-3">
                          {/* Excel Upload Icon */}
                          <div className="relative">
                            <svg className="w-12 h-12 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              <path d="M8,12H16V14H8V12M8,16H16V18H8V16M8,8H10V10H8V8" fill="#6b7280"/>
                        </svg>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-center">
                          <p className="text-sm text-neutral-300 font-medium">Click to upload Excel file</p>
                            <p className="text-xs text-neutral-400 mt-1">Supports .xlsx and .xls files</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Semester comes from Row 1 in the Excel. No manual override controls. */}
              
              <div className="mt-3 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-2">Expected Excel Format:</h4>
                <div className="text-xs text-blue-200 space-y-2">
                  <div className="p-2 bg-green-900/20 border border-green-700 rounded">
                    <strong className="text-green-300">Sample Format:</strong>
                    <div className="mt-1 text-xs text-green-200">
                      <div className="font-mono">Row 1: Semester | 6 | 6 | 6 | 6 | 6</div>
                      <div className="font-mono">Row 2: subject Credit | 3 | 0 | 2 | 1.5 | 2</div>
                      <div className="font-mono">Row 3: Subject code | CCS332 | CCS334 | CCS336 | CCS351</div>
                      <div className="font-mono">Row 4: Subject name | Operating systems | Computer Networks | Big data analytics | Algorithms</div>
                      <div className="font-mono">Row 5: Student name | Register number | Grade | Grade | Grade</div>
                      <div className="font-mono">Row 6: Nithishwaran A | 710022104002 | A | B+ | A+</div>
                    </div>
                  </div>
                  <div>
                    <strong className="text-blue-300">Required Structure (Multi-Row Headers):</strong>
                    <div className="ml-4 mt-1 space-y-1">
                      <p>• <span className="font-mono">Row 1:</span> Semester (all cells contain semester number)</p>
                      <p>• <span className="font-mono">Row 2:</span> Subject Credits (3, 7, 9, 3, 2, etc.)</p>
                      <p>• <span className="font-mono">Row 3:</span> Subject Codes (CCS332, CCS334, CS3691, etc.)</p>
                      <p>• <span className="font-mono">Row 4:</span> Subject Names</p>
                      <p>• <span className="font-mono">Row 5:</span> "Student n Register n" and "Grade" labels</p>
                      <p>• <span className="font-mono">Row 6+:</span> Student data (Name, Reg No, Grades)</p>
                    </div>
                  </div>
                  <div>
                    <strong className="text-blue-300">Required Columns (Alternative Names Supported):</strong>
                    <div className="ml-4 mt-1 space-y-1">
                      <p>• <span className="font-mono">Student Name:</span> Name, Full Name, Student's Name</p>
                      <p>• <span className="font-mono">Register Number:</span> Register Number, Reg No, Registration Number, Roll Number, Student ID, ID No</p>
                      <p>• <span className="font-mono">Subject Code:</span> Subject Code, Sub Code, Course Code, Course ID, Subj Code</p>
                      <p>• <span className="font-mono">Subject Name:</span> Subject Name, Sub Name, Course Name, Subj Name</p>
                      <p>• <span className="font-mono">Grade:</span> Grade, Grades, Result, Score, Mark</p>
                      <p>• <span className="font-mono">Semester:</span> Semester, Sem, Term, Academic Term, Session</p>
                      <p>• <span className="font-mono">Subject Credit:</span> Subject Credit, Sub Credit, Credit, Credits, Credit Hours, Course Credits</p>
                    </div>
                  </div>
                  <p className="text-blue-300 font-medium mt-2">Note: Credits are extracted from Row 2, Semester from Row 1</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setShowUploadModal(false)
                  setExcelFile(null)
                  setFileInputKey(prev => prev + 1) // Reset file input
                  // Reset the file input
                  const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ''
                  }
                }}
                className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleExcelUpload}
                disabled={uploadingExcel || !excelFile}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                {uploadingExcel ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Results
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Placement Representative Modal */}
      {showRepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Create Placement Representative</h3>
            <div className="space-y-3 mb-4 sm:mb-6 text-sm">
              <div className="text-neutral-300">Department: <span className="text-white font-semibold">{department}</span></div>
              <div className="text-neutral-300">Year: <span className="text-white font-semibold">{year}</span></div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username</label>
                <input value={repForm.username} onChange={(e)=>setRepForm({...repForm, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., cse-final-rep"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Representative Name (optional)</label>
                <input value={repForm.name} onChange={(e)=>setRepForm({...repForm, name: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., John Doe"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Representative Email</label>
                <input 
                  type="email"
                  value={repForm.email} 
                  onChange={(e)=>{
                    setRepForm({...repForm, email: e.target.value})
                  }} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="e.g., rep@example.com"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Password</label>
                <PasswordInput value={repForm.password} onChange={(e)=>setRepForm({...repForm, password: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter a strong password"/>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <div className="text-neutral-400 text-xs mb-2">Verify main admin to confirm creation</div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input value={adminCredentials.username} onChange={(e)=>setAdminCredentials({...adminCredentials, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter admin username"/>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                  <PasswordInput value={adminCredentials.password} onChange={(e)=>setAdminCredentials({...adminCredentials, password: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter admin password"/>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={()=>setShowRepModal(false)} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1">Cancel</button>
              <button onClick={async ()=>{
                try {
                  // Validate email format
                  if (!repForm.email || !validateEmail(repForm.email)) {
                    showErrorMessage('Please enter a valid email address (must contain @ and proper domain)')
                    return
                  }
                  
                  // verify main admin first
                  const verify = await api.post('/admin/verify', adminCredentials)
                  if (!verify.data.valid) { showErrorMessage('Invalid admin credentials'); return }
                  await api.post('/admin/reps', { username: repForm.username.trim(), password: repForm.password, department, year, name: repForm.name.trim(), email: repForm.email.trim() })
                  setShowRepModal(false)
                  setRepForm({ username:'', password:'', name:'', email:'' })
                  setAdminCredentials({ username:'', password:'' })
                  showSuccessMessage('Placement representative created')
                  try {
                    const r = await api.get('/admin/reps', { params: { department, year } })
                    const list = Array.isArray(r.data) ? r.data.map((x:any)=>({ username: x.username, name: x.name, email: x.email })) : []
                    setRepList(list)
                  } catch {}
                } catch(e:any) {
                  showErrorMessage(e?.response?.data?.error || 'Failed to create representative')
                }
              }} className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50">Create Rep</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Placement Representative Modal (admin verification) */}
      {showRepDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Delete Placement Representative</h3>
            <p className="text-sm text-neutral-300 mb-4">This will remove <span className="text-white font-semibold">{repToDelete}</span> for {department} {year}. Please verify main admin credentials to continue.</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input value={adminCredentials.username} onChange={(e)=>setAdminCredentials({...adminCredentials, username: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput value={adminCredentials.password} onChange={(e)=>setAdminCredentials({...adminCredentials, password: e.target.value})} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={()=>{setShowRepDeleteModal(false); setAdminCredentials({username:'', password:''})}} className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1">Cancel</button>
              <button onClick={async ()=>{
                try {
                  const verify = await api.post('/admin/verify', adminCredentials)
                  if (!verify.data.valid) { showErrorMessage('Invalid admin credentials'); return }
                  await api.delete(`/admin/reps/${encodeURIComponent(repToDelete)}`)
                  setShowRepDeleteModal(false)
                  setAdminCredentials({username:'', password:''})
                  showSuccessMessage('Representative deleted')
                  try {
                    const r = await api.get('/admin/reps', { params: { department, year } })
                    const list = Array.isArray(r.data) ? r.data.map((x:any)=>({ username: x.username })) : []
                    setRepList(list)
                  } catch {}
                } catch(e:any) {
                  showErrorMessage(e?.response?.data?.error || 'Failed to delete representative')
                }
              }} className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2">Delete Rep</button>
            </div>
          </div>
        </div>
      )}
      
            {/* Filter Modal */}
            {showFilterModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Filter Students</h3>
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="text-neutral-400 hover:text-white text-xl sm:text-2xl"
                    >
                      ×
                    </button>
                  </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Placement Willingness */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Placement Willingness</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToPlace"
                      checked={filters.willingToPlace.includes('true')}
                      onClick={() => {
                        if (filters.willingToPlace.includes('true')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, willingToPlace: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, willingToPlace: ['true'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Willing to Place</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToPlace"
                      checked={filters.willingToPlace.includes('false')}
                      onClick={() => {
                        if (filters.willingToPlace.includes('false')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, willingToPlace: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, willingToPlace: ['false'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Not Willing to Place</span>
                  </label>
                </div>
              </div>

              {/* History of Arrears */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">History of Arrears</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historyOfArrears"
                      checked={filters.historyOfArrears.includes('none')}
                      onClick={() => {
                        if (filters.historyOfArrears.includes('none')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, historyOfArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, historyOfArrears: ['none'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Arrears</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historyOfArrears"
                      checked={filters.historyOfArrears.includes('has')}
                      onClick={() => {
                        if (filters.historyOfArrears.includes('has')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, historyOfArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, historyOfArrears: ['has'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Arrears</span>
                  </label>
                </div>
              </div>

              {/* Current Arrears */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Current Arrears</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="currentArrears"
                      checked={filters.currentArrears.includes('none')}
                      onClick={() => {
                        if (filters.currentArrears.includes('none')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, currentArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, currentArrears: ['none'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Current Arrears</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="currentArrears"
                      checked={filters.currentArrears.includes('has')}
                      onClick={() => {
                        if (filters.currentArrears.includes('has')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, currentArrears: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, currentArrears: ['has'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Current Arrears</span>
                  </label>
                </div>
              </div>

              {/* CGPA Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">CGPA Range</label>
                <select
                  value={filters.cgpaRange}
                  onChange={(e) => setFilters({ ...filters, cgpaRange: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select CGPA Range</option>
                  <option value="9.0+">9.0 and above</option>
                  <option value="8.5+">8.5 and above</option>
                  <option value="8.0+">8.0 and above</option>
                  <option value="7.5+">7.5 and above</option>
                  <option value="7.0+">7.0 and above</option>
                  <option value="6.5+">6.5 and above</option>
                  <option value="6.0+">6.0 and above</option>
                  <option value="5.5+">5.5 and above</option>
                  <option value="5.0+">5.0 and above</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Technical Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Technical Skills</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSkill.technical}
                      onChange={(e) => setTempSkill({ ...tempSkill, technical: e.target.value })}
                      placeholder="Add technical skill"
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill('technical')
                        }
                      }}
                    />
                    <button
                      onClick={() => addSkill('technical')}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs sm:text-sm whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.technicalSkills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded">
                        {skill}
                        <button
                          onClick={() => removeSkill('technical', index)}
                          className="ml-1 text-blue-200 hover:text-white text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Soft Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Soft Skills</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSkill.soft}
                      onChange={(e) => setTempSkill({ ...tempSkill, soft: e.target.value })}
                      placeholder="Add soft skill"
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill('soft')
                        }
                      }}
                    />
                    <button
                      onClick={() => addSkill('soft')}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs sm:text-sm whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.softSkills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs sm:text-sm rounded">
                        {skill}
                        <button
                          onClick={() => removeSkill('soft', index)}
                          className="ml-1 text-green-200 hover:text-white text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* HSC Percentage */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">HSC Percentage</label>
                <select
                  value={filters.hscPercentage}
                  onChange={(e) => setFilters({ ...filters, hscPercentage: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select HSC Percentage</option>
                  <option value="95+">95% and above</option>
                  <option value="90+">90% and above</option>
                  <option value="85+">85% and above</option>
                  <option value="80+">80% and above</option>
                  <option value="75+">75% and above</option>
                  <option value="70+">70% and above</option>
                  <option value="65+">65% and above</option>
                  <option value="60+">60% and above</option>
                </select>
              </div>

              {/* SSLC Percentage */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">SSLC Percentage</label>
                <select
                  value={filters.sslcPercentage}
                  onChange={(e) => setFilters({ ...filters, sslcPercentage: e.target.value })}
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-xs sm:text-sm"
                >
                  <option value="">Select SSLC Percentage</option>
                  <option value="95+">95% and above</option>
                  <option value="90+">90% and above</option>
                  <option value="85+">85% and above</option>
                  <option value="80+">80% and above</option>
                  <option value="75+">75% and above</option>
                  <option value="70+">70% and above</option>
                  <option value="65+">65% and above</option>
                  <option value="60+">60% and above</option>
                </select>
              </div>

              {/* Has Internship */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Internship Experience</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasInternship"
                      checked={filters.hasInternship.includes('yes')}
                      onClick={() => {
                        if (filters.hasInternship.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasInternship: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasInternship: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Internship</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasInternship"
                      checked={filters.hasInternship.includes('no')}
                      onClick={() => {
                        if (filters.hasInternship.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasInternship: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasInternship: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Internship</span>
                  </label>
                </div>
              </div>

              {/* Has Projects */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Projects</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasProjects"
                      checked={filters.hasProjects.includes('yes')}
                      onClick={() => {
                        if (filters.hasProjects.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasProjects: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasProjects: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Projects</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasProjects"
                      checked={filters.hasProjects.includes('no')}
                      onClick={() => {
                        if (filters.hasProjects.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasProjects: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasProjects: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Projects</span>
                  </label>
                </div>
              </div>

              {/* Has Certifications */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Certifications</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCertifications"
                      checked={filters.hasCertifications.includes('yes')}
                      onClick={() => {
                        if (filters.hasCertifications.includes('yes')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasCertifications: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasCertifications: ['yes'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">Has Certifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCertifications"
                      checked={filters.hasCertifications.includes('no')}
                      onClick={() => {
                        if (filters.hasCertifications.includes('no')) {
                          // If already selected, deselect it
                          setFilters({ ...filters, hasCertifications: [] })
                        } else {
                          // Select this option
                          setFilters({ ...filters, hasCertifications: ['no'] })
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-neutral-300 text-sm sm:text-base">No Certifications</span>
                  </label>
                </div>
              </div>

              
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 border-t border-neutral-700">
              <button
                onClick={applyFilters}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-sm font-medium"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Confirm Bulk Delete</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{selectedStudents.size} student(s)</span> from {department} Department, {year} Year? 
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelBulkDelete}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Verification Modal */}
      {showAdminVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Admin Verification Required</h3>
            <p className="text-sm sm:text-base text-neutral-300 mb-4 sm:mb-6">
              Please enter your admin credentials to confirm deletion of {selectedStudents.size} student(s).
            </p>
            
            <div className="space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                <PasswordInput
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={cancelBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyAdminAndDelete}
                disabled={isDeleting || !adminCredentials.username || !adminCredentials.password}
                className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Placement Representative Modal */}
      {showRepEditModal && editingRep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Edit Placement Representative</h3>
            <div className="space-y-3 mb-4 sm:mb-6 text-sm">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Username *</label>
                <input 
                  value={repEditForm.username} 
                  onChange={(e)=>setRepEditForm({...repEditForm, username: e.target.value})} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter username"
                />
              </div>
              <div className="text-neutral-300">Department: <span className="text-white font-semibold">{department}</span></div>
              <div className="text-neutral-300">Year: <span className="text-white font-semibold">{year}</span></div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Representative Name</label>
                <input 
                  value={repEditForm.name} 
                  onChange={(e)=>setRepEditForm({...repEditForm, name: e.target.value})} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Representative Email</label>
                <input 
                  value={repEditForm.email} 
                  onChange={(e)=>setRepEditForm({...repEditForm, email: e.target.value})} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., rep@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">New Password (leave blank to keep current)</label>
                <PasswordInput 
                  value={repEditForm.password} 
                  onChange={(e)=>setRepEditForm({...repEditForm, password: e.target.value})} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter new password"
                />
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <div className="text-neutral-400 text-xs mb-2">Verify main admin to confirm update</div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Username</label>
                <input 
                  value={adminCredentials.username} 
                  onChange={(e)=>setAdminCredentials({...adminCredentials, username: e.target.value})} 
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter admin username"
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Password</label>
                  <PasswordInput 
                    value={adminCredentials.password} 
                    onChange={(e)=>setAdminCredentials({...adminCredentials, password: e.target.value})} 
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter admin password"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={()=>{
                  setShowRepEditModal(false)
                  setEditingRep(null)
                  setRepEditForm({ username: '', name: '', email: '', password: '' })
                  setAdminCredentials({ username: '', password: '' })
                }} 
                className="px-4 py-2.5 sm:py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async ()=>{
                  try {
                    // verify main admin first
                    const verify = await api.post('/admin/verify', adminCredentials)
                    if (!verify.data.valid) { showErrorMessage('Invalid admin credentials'); return }
                    
                    const updateData: any = { 
                      username: repEditForm.username.trim(),
                      name: repEditForm.name.trim(), 
                      email: repEditForm.email.trim() 
                    }
                    if (repEditForm.password.trim()) {
                      updateData.password = repEditForm.password.trim()
                    }
                    
                    await api.put(`/admin/reps/${encodeURIComponent(editingRep.username)}`, updateData)
                    setShowRepEditModal(false)
                    setEditingRep(null)
                    setRepEditForm({ username: '', name: '', email: '', password: '' })
                    setAdminCredentials({ username: '', password: '' })
                    showSuccessMessage('Placement representative updated')
                    
                    // Refresh rep list
                    try {
                      const r = await api.get('/admin/reps', { params: { department, year } })
                      const list = Array.isArray(r.data) ? r.data.map((x:any)=>({ username: x.username, name: x.name, email: x.email })) : []
                      setRepList(list)
                    } catch {}
                  } catch(e:any) {
                    showErrorMessage(e?.response?.data?.error || 'Failed to update representative')
                  }
                }} 
                className="px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50"
              >
                Update Rep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Admin Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={()=>{ setShowVerifyModal(false); setVerifyForm({ username:'', password:'' }); }}></div>
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-white text-base sm:text-lg font-semibold">Verify Admin</h3>
              <button onClick={()=>{ setShowVerifyModal(false); setVerifyForm({ username:'', password:'' }); }} className="text-neutral-300 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Admin Username</label>
                <input value={verifyForm.username} onChange={e=>setVerifyForm({ ...verifyForm, username:e.target.value })} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Admin Password</label>
                <PasswordInput value={verifyForm.password} onValueChange={(v)=>setVerifyForm({ ...verifyForm, password:v })} className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button onClick={()=>{ setShowVerifyModal(false); setVerifyForm({ username:'', password:'' }); }} className="px-3 py-2 rounded-md border border-neutral-700 text-neutral-200">Cancel</button>
              <button onClick={verifyAdminCredentials} className="px-3 py-2 rounded-md border border-blue-700 text-blue-200 hover:bg-blue-900/30">Verify</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  )
}




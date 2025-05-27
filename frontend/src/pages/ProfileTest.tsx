import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { addFavoriteDrinkColumn, checkFavoriteDrinkColumn } from '@/lib/addFavoriteDrinkColumn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfileTest() {
  const { user } = useAuth()
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<string>('')

  const checkTableStructure = async () => {
    try {
      // First check if user_profiles table exists and what columns it has
      console.log('Checking user_profiles table structure...')

      // Try to select specific columns to see what exists
      const { data: basicData, error: basicError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, bio, avatar_url, created_at, updated_at')
        .limit(1)

      if (basicError) {
        setTestResult(`❌ Basic columns error: ${basicError.message}`)
        return
      }

      console.log('Basic columns work:', basicData)

      // Now try to select with favorite_drink
      const { data: fullData, error: fullError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, bio, avatar_url, favorite_drink, created_at, updated_at')
        .limit(1)

      if (fullError) {
        setTestResult(`❌ favorite_drink column missing: ${fullError.message}`)
        setTableInfo({ basic: basicData, error: 'favorite_drink column not found' })
        return
      }

      setTableInfo(fullData)
      setTestResult('✅ All columns including favorite_drink exist!')
    } catch (error: any) {
      setTestResult(`❌ Unexpected error: ${error.message}`)
      console.error('Table check error:', error)
    }
  }

  const testFavoriteDrinkUpdate = async () => {
    if (!user) {
      setTestResult('❌ Please log in first')
      return
    }

    try {
      // Try to update favorite_drink
      const { error } = await supabase
        .from('user_profiles')
        .update({ favorite_drink: 'beer' })
        .eq('user_id', user.id)
        .select()

      if (error) {
        setTestResult(`❌ Update failed: ${error.message}`)
        return
      }

      setTestResult('✅ Favorite drink update successful!')
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    }
  }

  const runMigration = async () => {
    setTestResult('🔄 Running migration...')
    const result = await addFavoriteDrinkColumn()

    if (result.success) {
      setTestResult(`✅ ${result.message}`)
      // Recheck table structure
      setTimeout(checkTableStructure, 1000)
    } else {
      setTestResult(`❌ ${result.message}`)
      if (result.instructions) {
        setTableInfo({ instructions: result.instructions })
      }
    }
  }

  const checkColumnExists = async () => {
    const result = await checkFavoriteDrinkColumn()
    if (result.exists) {
      setTestResult('✅ favorite_drink column exists!')
    } else {
      setTestResult(`❌ favorite_drink column missing: ${result.error}`)
    }
  }

  useEffect(() => {
    checkTableStructure()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Database Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <p className="text-sm bg-muted p-2 rounded">{testResult}</p>
          </div>

          <div className="space-x-2 space-y-2">
            <Button onClick={checkTableStructure} variant="outline">
              Check Table Structure
            </Button>
            <Button onClick={checkColumnExists} variant="outline">
              Check Column Exists
            </Button>
            <Button onClick={runMigration} className="bg-primary">
              Add favorite_drink Column
            </Button>
            <Button onClick={testFavoriteDrinkUpdate}>
              Test Favorite Drink Update
            </Button>
          </div>

          {tableInfo && (
            <div>
              <h3 className="font-semibold mb-2">Sample Data:</h3>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(tableInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

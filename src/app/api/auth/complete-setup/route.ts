import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log('[complete-setup] API called');
  
  // Get request body
  let body: any = {};
  try {
    body = await request.json();
    console.log('[complete-setup] Request body:', body);
  } catch (err) {
    console.log('[complete-setup] No request body or invalid JSON');
    body = {};
  }

  // Check if this is the final setup completion (from FinishSetup page)
  const isFinalSetup = body.finalSetup === true;
  
  console.log('[complete-setup] Is final setup:', isFinalSetup);

  if (isFinalSetup) {
    // This is the final step - mark setup as complete
    console.log('[complete-setup] Final setup - marking as complete');
    return NextResponse.json({ 
      success: true, 
      message: 'Setup completed successfully',
      user: { 
        isSetupComplete: true,
        ...(body.dob && { 
          dob: body.dob, 
          dateOfBirth: body.dob 
        })
      }
    });
  } else {
    // This is an intermediate step (like saving DOB) - don't mark as complete yet
    console.log('[complete-setup] Intermediate setup step - not marking as complete');
    return NextResponse.json({ 
      success: true, 
      message: 'Profile information saved successfully',
      user: { 
        isSetupComplete: false, // Keep false until final step
        ...(body.dob && { 
          dob: body.dob, 
          dateOfBirth: body.dob 
        })
      }
    });
  }
}
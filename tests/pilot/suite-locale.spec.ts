import { expect, test } from "@playwright/test";
const screens = [{"route":"/teacher","es":"Espacio docente","en":"Teacher Workspace"},{"route":"/students","es":"Perfil de apoyo estudiantil","en":"Student Support Profile"},{"route":"/family","es":"Centro de participaci\u00f3n familiar","en":"Family Engagement Center"},{"route":"/inclusion","es":"Centro de inclusi\u00f3n y PIAR","en":"Inclusion & PIAR Center"},{"route":"/adaptive","es":"Centro de inteligencia adaptativa","en":"Adaptive Intelligence Center"},{"route":"/research","es":"Centro de investigaci\u00f3n en IA educativa inclusiva","en":"Inclusive Educational AI Research Center"},{"route":"/dashboard","es":"Panel ejecutivo de investigaci\u00f3n","en":"Executive Research Dashboard"},{"route":"/administration","es":"Administraci\u00f3n","en":"Administration"},{"route":"/users","es":"Gesti\u00f3n de usuarios","en":"User management"},{"route":"/roles","es":"Gesti\u00f3n de roles","en":"Role management"},{"route":"/permissions","es":"Gesti\u00f3n de permisos","en":"Permission management"},{"route":"/assessment-definition-preview","es":"Motor gen\u00e9rico de instrumentos","en":"Generic Instrument Engine"},{"route":"/assessments","es":"Centro de evaluaciones","en":"Assessment center"},{"route":"/security/mfa","es":"Autenticaci\u00f3n multifactor","en":"Multi-factor authentication"},{"route":"/research/authorized","es":"Investigaci\u00f3n autorizada","en":"Authorized research"}] as const;

const profiles = [{id:"SYNTHETIC-HIGH",fullName:"Synthetic High",grade:"TEST",age:16,learningProfile:"Unassessed",vocationalInterest:"Unassessed",supportLevel:"HIGH",inclusiveStrategies:[],pedagogicalRecommendations:[]}];
const studentRoutes=["/teacher","/students","/family","/inclusion","/adaptive"];
for(const initial of ["es","en"] as const)for(const width of [360,768,1440])for(const screen of screens){
 test("suite "+screen.route+" "+initial+" "+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(locale=>localStorage.setItem("ilp.locale",locale),initial);
  await page.route("**/auth/**",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({accessToken:"SYNTHETIC",email:"review@example.invalid",mfaRequired:false})}));
  await page.route("**/analytics/**",r=>r.fulfill({status:404,contentType:"application/json",body:JSON.stringify({code:"SYNTHETIC_UNAVAILABLE"})}));
  let studentRequests=0;
  await page.route("**/api/**",r=>{
   const url=new URL(r.request().url());
   if(url.pathname.includes("/recommendations/"))return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({teacherRecommendations:[],inclusionRecommendations:[],familyRecommendations:[],nextActions:[]})});
   if(url.pathname.endsWith("/students")){studentRequests++;return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(profiles)});}
   return r.fulfill({status:404,contentType:"application/json",body:JSON.stringify({code:"SYNTHETIC_UNAVAILABLE"})});
  });
  await page.goto(screen.route);
  const main=page.locator("main");
  const screenContent=main.locator(":not(.ilp-visually-hidden)");
  await expect(screenContent.getByText(screen[initial],{exact:true}).filter({visible:true})).toBeVisible();
  if(studentRoutes.includes(screen.route))await expect(main.getByText("Synthetic High",{exact:true}).first()).toBeVisible();
  const initialRequests=studentRequests;
  for(const locale of [initial,initial==="es"?"en":"es",initial] as const){
   if(locale!==await page.locator("html").getAttribute("lang")){
    await page.locator("header").getByRole("combobox").click();
    await page.getByRole("option").nth(locale==="es"?0:1).click();
    await expect(page.getByRole("listbox")).not.toBeVisible();
   }
   await expect(page.locator("html")).toHaveAttribute("lang",locale);
   await expect(screenContent.getByText(screen[locale],{exact:true}).filter({visible:true})).toBeVisible();
   await expect(screenContent.getByText(screen[locale==="es"?"en":"es"],{exact:true}).filter({visible:true})).toHaveCount(0);
   if(studentRoutes.includes(screen.route)){
    await expect(main.getByText("Synthetic High",{exact:true}).first()).toBeVisible();
    expect(studentRequests).toBe(initialRequests);
   }
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:"Translated screen must fit viewport"}).toBe(true);
  }
 });
}

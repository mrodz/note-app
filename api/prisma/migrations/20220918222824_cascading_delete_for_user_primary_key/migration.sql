ALTER TABLE 
	"Document" 
DROP CONSTRAINT 
	"Document_userId_fkey"
;

ALTER TABLE 
	"Document" 
ADD CONSTRAINT 
	"Document_userId_fkey" 
FOREIGN KEY 
	("userId")
REFERENCES 
	"User"("id") 
ON DELETE 
	CASCADE 
ON UPDATE 
	CASCADE
;


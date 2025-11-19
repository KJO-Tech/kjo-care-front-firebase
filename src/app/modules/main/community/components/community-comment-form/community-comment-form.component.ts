import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'community-comment-form',
  templateUrl: './community-comment-form.component.html',
  imports: [ReactiveFormsModule],
})
export class CommunityCommentFormComponent {
  // private fb = inject(FormBuilder);
  // private commentService = inject(CommentService);
  // private keycloakService = inject(KeycloakService);
  // private toastService = inject(ToastService);
  //
  // blogId = input.required<string>();
  //
  // reload = output();
  //
  // commentForm = this.fb.group({
  //   content: ['', [Validators.required, Validators.minLength(1)]]
  // });
  //
  // // constructor() {
  // //   effect(() => {
  // //     this.commentForm.reset();
  // //     this.commentForm.clearValidators();
  // //
  // //     if (this.commentService._selectedComment().id.length > 0) {
  // //       this.commentForm.patchValue({
  // //         content: this.commentService.selectedComment.content
  // //       });
  // //     }
  // //
  // //     if (this.commentService._selectedComment().commentParentId && this.commentService._selectedComment().id.length === 0) {
  // //       this.commentForm.patchValue({
  // //         content: ''
  // //       });
  // //     }
  // //   });
  // // }
  //
  // onSubmit() {
  //   if (this.commentForm.invalid) {
  //     this.commentForm.markAllAsTouched();
  //     console.log('Form invalid');
  //     return;
  //   }
  //
  //   const request = {
  //     id: this.commentService.selectedComment.id,
  //     content: this.commentForm.value.content!,
  //     blogId: this.blogId(),
  //     commentParentId: this.commentService.selectedComment.commentParentId
  //   };
  //
  //   // if (this.commentService.selectedComment.id.length > 0) {
  //   //   return this.commentService.update(request, this.commentService.selectedComment.id).pipe()
  //   //     .subscribe({
  //   //       next: () => {
  //   //         this.toastService.addToast({
  //   //           message: 'Comment updated successfully',
  //   //           type: 'success',
  //   //           duration: 4000
  //   //         });
  //   //
  //   //         this.reloadComments();
  //   //         this.commentForm.reset();
  //   //         this.commentForm.clearValidators();
  //   //       },
  //   //       error: (error) => {
  //   //         this.toastService.addToast({
  //   //           message: error.message || 'Error updating comment',
  //   //           type: 'error',
  //   //           duration: 4000
  //   //         });
  //   //       }
  //   //     });
  //   // } else {
  //   return this.commentService.create(request).pipe()
  //     .subscribe({
  //       next: () => {
  //         this.toastService.addToast({
  //           message: 'Comentario creado con éxito',
  //           type: 'success',
  //           duration: 4000
  //         });
  //
  //         this.reloadComments();
  //         this.commentForm.reset();
  //         this.commentForm.clearValidators();
  //         this.commentForm.markAsUntouched();
  //       },
  //       error: (error) => {
  //         this.toastService.addToast({
  //           message: 'Error al crear el comentario',
  //           type: 'error',
  //           duration: 4000
  //         });
  //       }
  //     });
  //   // }
  // }
  //
  // getUserLetters() {
  //   const firstName: string = this.keycloakService.profile()?.firstName ?? '?';
  //   const lastName: string = this.keycloakService.profile()?.lastName ?? '?';
  //   return firstName[0] + lastName[0];
  // }
  //
  // reloadComments() {
  //   this.reload.emit();
  // }
  //
  // protected readonly formUtils = FormUtils;
}
